from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
from pymongo import MongoClient
import traceback
from datetime import datetime
from zoneinfo import ZoneInfo
import secrets
import hashlib
import csv
from io import StringIO


# Set up MongoDB connection (adjust URI as needed)
client = MongoClient("mongodb://inventory_admin:BEL%402479@localhost:27017/")
db = client["inventory_db"]  # Use your DB name
collection = db["product_details"]
log_collection = db["api_logs"]
users_collection = db["users"]
sessions_collection = db["sessions"]

# Bootstrap a default admin user if none exists
try:
    if users_collection.count_documents({}) == 0:
        users_collection.insert_one({
            "name": "Administrator",
            "username": "admin",
            "password_hash": hashlib.sha256(("bel_simple_salt" + "admin123").encode("utf-8")).hexdigest(),
            "role": "admin",
            "created_at": datetime.now(ZoneInfo("Asia/Kolkata"))
        })
except Exception:
    # If Mongo isn't reachable at import time, ignore; runtime endpoints will fail gracefully
    pass

# Clean up expired sessions (older than 24 hours)
def cleanup_expired_sessions():
    try:
        from datetime import timedelta
        cutoff_time = datetime.now(ZoneInfo("Asia/Kolkata")) - timedelta(hours=24)
        sessions_collection.delete_many({"created_at": {"$lt": cutoff_time}})
    except Exception:
        pass  # Ignore cleanup errors

# Logging function to store logs in MongoDB
def log_api_response(endpoint, method, request_data, response_data):
    log_entry = {
        "endpoint": endpoint,
        "method": method,
        "request_data": request_data,
        "response_data": response_data,
        "timestamp": datetime.now(ZoneInfo("Asia/Kolkata"))
    }
    log_collection.insert_one(log_entry)


# ----------------------
# Auth helpers
# ----------------------
def hash_password(password: str) -> str:
    salt = "bel_simple_salt"  # replace with env var in prod
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


def generate_token() -> str:
    return secrets.token_hex(32)


def get_auth_token_from_request(request):
    auth_header = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def get_user_from_token(request):
    token = get_auth_token_from_request(request)
    if not token:
        return None
    session = sessions_collection.find_one({"token": token})
    if not session:
        return None
    user = users_collection.find_one({"_id": session.get("user_id")})
    if not user:
        return None
    return {"id": str(user.get("_id")), "username": user.get("username"), "role": user.get("role"), "name": user.get("name")}


def require_auth(request, role: str | None = None):
    user = get_user_from_token(request)
    if not user:
        return None, JsonResponse({"error": "Unauthorized"}, status=401)
    if role and user.get("role") != role:
        return None, JsonResponse({"error": "Forbidden"}, status=403)
    return user, None


# ----------------------
# Auth endpoints
# ----------------------
@csrf_exempt
def login(request):
    if request.method != "POST":
        error_response = {"error": "Only POST allowed"}
        log_api_response("login", request.method, getattr(request, 'body', None), error_response)
        return JsonResponse(error_response, status=405)
    try:
        body = json.loads(request.body or b"{}")
        username = (body.get("username") or "").strip()
        password = body.get("password") or ""
        if not username or not password:
            response = {"error": "username and password are required"}
            log_api_response("login", request.method, body, response)
            return JsonResponse(response, status=400)

        user = users_collection.find_one({"username": username})
        if not user or user.get("password_hash") != hash_password(password):
            response = {"error": "Invalid credentials"}
            log_api_response("login", request.method, {"username": username}, response)
            return JsonResponse(response, status=401)

        # Clean up expired sessions before creating new one
        cleanup_expired_sessions()
        
        token = generate_token()
        sessions_collection.insert_one({
            "token": token,
            "user_id": user.get("_id"),
            "role": user.get("role"),
            "created_at": datetime.now(ZoneInfo("Asia/Kolkata"))
        })

        response = {
            "token": token, 
            "role": user.get("role"),
            "username": user.get("username"),
            "name": user.get("name")
        }
        log_api_response("login", request.method, {"username": username}, response)
        return JsonResponse(response)
    except Exception as e:
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("login", request.method, getattr(request, 'body', None), {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)


@csrf_exempt
def validate_token(request):
    if request.method != "GET":
        error_response = {"error": "Only GET allowed"}
        log_api_response("validate_token", request.method, None, error_response)
        return JsonResponse(error_response, status=405)
    
    user, err = require_auth(request)
    if err:
        return err
    
    try:
        # Clean up expired sessions
        cleanup_expired_sessions()
        
        # If we get here, the token is valid
        response = {
            "valid": True,
            "username": user.get("username"),
            "role": user.get("role"),
            "name": user.get("name")
        }
        log_api_response("validate_token", request.method, None, response)
        return JsonResponse(response)
    except Exception as e:
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("validate_token", request.method, None, {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)


@csrf_exempt
def logout(request):
    if request.method != "POST":
        error_response = {"error": "Only POST allowed"}
        log_api_response("logout", request.method, None, error_response)
        return JsonResponse(error_response, status=405)
    
    try:
        token = get_auth_token_from_request(request)
        if token:
            # Remove the session from the database
            sessions_collection.delete_one({"token": token})
        
        response = {"message": "Logged out successfully"}
        log_api_response("logout", request.method, None, response)
        return JsonResponse(response)
    except Exception as e:
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("logout", request.method, None, {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)


@csrf_exempt
def admin_add_user(request):
    if request.method != "POST":
        error_response = {"error": "Only POST allowed"}
        log_api_response("admin_add_user", request.method, getattr(request, 'body', None), error_response)
        return JsonResponse(error_response, status=405)

    user, err = require_auth(request, role="admin")
    if err:
        return err
    try:
        body = json.loads(request.body or b"{}")
        name = (body.get("name") or "").strip()
        username = (body.get("username") or "").strip().lower()
        password = body.get("password") or ""
        role = (body.get("role") or "user").strip().lower()

        if not name or not username or not password:
            response = {"error": "name, username, password are required"}
            log_api_response("admin_add_user", request.method, body, response)
            return JsonResponse(response, status=400)

        if role not in ["admin", "user"]:
            role = "user"

        exists = users_collection.find_one({"username": username})
        if exists:
            response = {"error": "username already exists"}
            log_api_response("admin_add_user", request.method, {"username": username}, response)
            return JsonResponse(response, status=409)

        doc = {
            "name": name,
            "username": username,
            "password_hash": hash_password(password),
            "role": role,
            "created_at": datetime.now(ZoneInfo("Asia/Kolkata"))
        }
        users_collection.insert_one(doc)
        response = {"message": "user created", "username": username, "role": role}
        log_api_response("admin_add_user", request.method, {"admin": user.get("username"), "new_user": username}, response)
        return JsonResponse(response, status=201)
    except Exception as e:
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("admin_add_user", request.method, getattr(request, 'body', None), {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)
 


# ----------------------
# Inventory: Item In / Out / CRUD by passNo
# ----------------------
@csrf_exempt
def items_in(request):
    if request.method != "POST":
        error_response = {"error": "Only POST allowed"}
        log_api_response("items_in", request.method, getattr(request, 'body', None), error_response)
        return JsonResponse(error_response, status=405)
    user, err = require_auth(request)
    if err:
        return err
    try:
        body = json.loads(request.body or b"{}")
        pass_no = (body.get("passNo") or "").strip()
        date_in = (body.get("dateIn") or datetime.now(ZoneInfo("Asia/Kolkata")).date().isoformat())
        customer = {
            "name": body.get("customerName"),
            "unitAddress": body.get("customerUnitAddress"),
            "location": body.get("customerLocation"),
            "phone": body.get("customerPhoneNo"),
        }
        project_name = body.get("projectName")
        items = body.get("items") or []

        if not pass_no:
            response = {"error": "passNo is required"}
            log_api_response("items_in", request.method, body, response)
            return JsonResponse(response, status=400)

        exists = collection.find_one({"passNo": pass_no})
        if exists:
            response = {"error": "passNo already exists"}
            log_api_response("items_in", request.method, {"passNo": pass_no}, response)
            return JsonResponse(response, status=409)

        normalized_items = []
        for it in items:
            normalized_items.append({
                "equipmentType": it.get("equipmentType"),
                "itemName": it.get("itemName"),
                "partNumber": it.get("partNumber"),
                "serialNumber": it.get("serialNumber"),
                "defectDetails": it.get("defectDetails"),
                "itemIn": True,  # Always true when item is entered
                "itemOut": False,
                "dateOut": None,  # Will be set when item goes out
                "itemRectificationDetails": "",  # New field for rectification details
            })
        
        # Sort items by part number in ascending order
        normalized_items.sort(key=lambda x: x.get("partNumber", ""))

        doc = {
            "passNo": pass_no,
            "dateIn": date_in,
            "customer": customer,
            "projectName": project_name,
            "items": normalized_items,
            "createdBy": user.get("username"),
            "createdAt": datetime.now(ZoneInfo("Asia/Kolkata")),
            "updatedAt": datetime.now(ZoneInfo("Asia/Kolkata")),
        }
        collection.insert_one(doc)
        doc.pop("_id", None)
        response = {"message": "Item In recorded", "data": doc}
        log_api_response("items_in", request.method, {"passNo": pass_no}, response)
        return JsonResponse(response, status=201)
    except Exception as e:
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("items_in", request.method, getattr(request, 'body', None), {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)


def get_item_by_passno(request, pass_no):
    if request.method != "GET":
        error_response = {"error": "Only GET allowed"}
        log_api_response("get_item_by_passno", request.method, {"passNo": pass_no}, error_response)
        return JsonResponse(error_response, status=405)
    user, err = require_auth(request)
    if err:
        return err
    try:
        doc = collection.find_one({"passNo": pass_no}, {"_id": 0})
        if not doc:
            response = {"error": "Not found"}
            log_api_response("get_item_by_passno", request.method, {"passNo": pass_no}, response)
            return JsonResponse(response, status=404)
        log_api_response("get_item_by_passno", request.method, {"passNo": pass_no}, doc)
        return JsonResponse(doc, safe=False)
    except Exception as e:
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("get_item_by_passno", request.method, {"passNo": pass_no}, {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)


@csrf_exempt
def update_item_out(request, pass_no):
    if request.method != "PUT":
        error_response = {"error": "Only PUT allowed"}
        log_api_response("update_item_out", request.method, {"passNo": pass_no}, error_response)
        return JsonResponse(error_response, status=405)
    user, err = require_auth(request)
    if err:
        return err
    try:
        print(f"=== ITEM OUT UPDATE DEBUG ===")
        print(f"Pass Number: {pass_no}")
        print(f"User: {user.get('username')}")
        print(f"Request body: {request.body}")
        
        body = json.loads(request.body or b"{}")
        updates = body.get("items") or []

        print(f"Parsed body: {body}")
        print(f"Updates array: {updates}")

        doc = collection.find_one({"passNo": pass_no})
        if not doc:
            response = {"error": "Not found"}
            log_api_response("update_item_out", request.method, {"passNo": pass_no}, response)
            return JsonResponse(response, status=404)

        print(f"Found document: {doc.get('passNo')}")
        print(f"Original items: {doc.get('items')}")

        # Check if we have the same number of items
        original_items = doc.get("items", [])
        if len(updates) != len(original_items):
            response = {"error": f"Number of items mismatch. Expected {len(original_items)}, got {len(updates)}"}
            return JsonResponse(response, status=400)

        print(f"DEBUG: Received updates: {updates}")
        
        # Update items by position (index) instead of serial number
        new_items = []
        for i, (original_item, update_item) in enumerate(zip(original_items, updates)):
            print(f"Processing item {i}: original={original_item.get('serialNumber')}, update={update_item.get('serialNumber')}")
            
            # Create updated item
            updated_item = original_item.copy()
            updated_item["itemOut"] = bool(update_item.get("itemOut", False))
            
            # Handle dateOut
            if updated_item["itemOut"]:
                if update_item.get("dateOut"):
                    updated_item["dateOut"] = update_item["dateOut"]
                elif not original_item.get("dateOut"):
                    updated_item["dateOut"] = datetime.now(ZoneInfo("Asia/Kolkata")).date().isoformat()
                    print(f"DEBUG: Auto-setting dateOut for item {i} to {updated_item['dateOut']}")
            else:
                updated_item["dateOut"] = None
                print(f"DEBUG: Clearing dateOut for item {i} since itemOut is False")
            
            # Handle rectification details
            if "itemRectificationDetails" in update_item:
                updated_item["itemRectificationDetails"] = update_item["itemRectificationDetails"] or ""
            
            print(f"Updated item {i}: {updated_item}")
            new_items.append(updated_item)

        print(f"Final items array: {new_items}")
        
        result = collection.update_one({"passNo": pass_no}, {"$set": {"items": new_items, "updatedAt": datetime.now(ZoneInfo("Asia/Kolkata")), "updatedBy": user.get("username")}})
        print(f"Update result: matched={result.matched_count}, modified={result.modified_count}")
        
        response = {"message": "ItemOut statuses updated"}
        log_api_response("update_item_out", request.method, {"passNo": pass_no, "updates_count": len(updates)}, response)
        return JsonResponse(response)
    except Exception as e:
        print(f"ERROR in update_item_out: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("update_item_out", request.method, {"passNo": pass_no}, {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)


@csrf_exempt
def edit_record(request, pass_no):
    user, err = require_auth(request)
    if err:
        return err
    try:
        if request.method == "GET":
            doc = collection.find_one({"passNo": pass_no}, {"_id": 0})
            if not doc:
                response = {"error": "Not found"}
                log_api_response("edit_record", request.method, {"passNo": pass_no}, response)
                return JsonResponse(response, status=404)
            log_api_response("edit_record", request.method, {"passNo": pass_no}, doc)
            return JsonResponse(doc, safe=False)
        elif request.method == "PUT":
            body = json.loads(request.body or b"{}")
            if body.get("passNo") and body.get("passNo") != pass_no:
                response = {"error": "passNo cannot be changed"}
                log_api_response("edit_record", request.method, {"passNo": pass_no}, response)
                return JsonResponse(response, status=400)

            allowed_fields = ["dateIn", "customer", "projectName", "items"]
            set_fields = {k: v for k, v in body.items() if k in allowed_fields}
            
            # Sort items by part number if items are being updated
            if "items" in set_fields:
                for item in set_fields["items"]:
                    item["itemIn"] = True  # Always true when item is entered
                    if "dateOut" not in item:
                        item["dateOut"] = None
                    if "itemRectificationDetails" not in item:
                        item["itemRectificationDetails"] = ""
                set_fields["items"].sort(key=lambda x: x.get("partNumber", ""))
            
            set_fields["updatedAt"] = datetime.now(ZoneInfo("Asia/Kolkata"))
            set_fields["updatedBy"] = user.get("username")
            result = collection.update_one({"passNo": pass_no}, {"$set": set_fields})
            if result.matched_count == 0:
                response = {"error": "Not found"}
                log_api_response("edit_record", request.method, {"passNo": pass_no}, response)
                return JsonResponse(response, status=404)
            response = {"message": "Record updated"}
            log_api_response("edit_record", request.method, {"passNo": pass_no}, response)
            return JsonResponse(response)
        elif request.method == "DELETE":
            result = collection.delete_one({"passNo": pass_no})
            if result.deleted_count == 0:
                response = {"error": "Not found"}
                log_api_response("edit_record", request.method, {"passNo": pass_no}, response)
                return JsonResponse(response, status=404)
            response = {"message": "Record deleted"}
            log_api_response("edit_record", request.method, {"passNo": pass_no}, response)
            return JsonResponse(response)
        else:
            error_response = {"error": "Method not allowed"}
            log_api_response("edit_record", request.method, {"passNo": pass_no}, error_response)
            return JsonResponse(error_response, status=405)
    except Exception as e:
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("edit_record", request.method, {"passNo": pass_no}, {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)


# ----------------------
# Search + download
# ----------------------
def _build_date_filter(from_str: str | None, to_str: str | None):
    if not from_str and not to_str:
        return None
    cond = {}
    if from_str:
        cond["$gte"] = from_str
    if to_str:
        cond["$lte"] = to_str
    return cond


def _build_search_query(params):
    search_type = params.get("type")
    value = params.get("value")
    from_date = params.get("from")
    to_date = params.get("to")
    query = {}
    if search_type == "PassNo" and value:
        query["passNo"] = value
    elif search_type == "ItemPartNo" and value:
        query["items.partNumber"] = value
    elif search_type == "ProjectName" and value:
        query["projectName"] = {"$regex": value, "$options": "i"}
    elif search_type == "DateRange":
        pass  # only date filter
    date_cond = _build_date_filter(from_date, to_date)
    if date_cond:
        query["dateIn"] = date_cond
    return query

def _filter_items_by_part_number(items, part_number):
    """Filter items to only include those matching the part number search"""
    if not part_number:
        return items
    return [item for item in items if item.get("partNumber") == part_number]


def _shape_search_result(doc):
    return {
        "passNo": doc.get("passNo"),
        "projectName": doc.get("projectName"),
        "dateIn": doc.get("dateIn"),
        "customer": doc.get("customer", {}),
        "items": doc.get("items", []),
        "createdBy": doc.get("createdBy", ""),
        "updatedBy": doc.get("updatedBy", ""),
    }


def search(request):
    if request.method != "GET":
        error_response = {"error": "Only GET allowed"}
        log_api_response("search", request.method, dict(request.GET), error_response)
        return JsonResponse(error_response, status=405)
    user, err = require_auth(request)
    if err:
        return err
    try:
        params = request.GET
        query = _build_search_query(params)
        docs = list(collection.find(query))
        results = [_shape_search_result({**d, "_id": None}) for d in docs]
        response = {"count": len(results), "data": results}
        log_api_response("search", request.method, dict(params), {"count": response["count"]})
        return JsonResponse(response)
    except Exception as e:
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("search", request.method, dict(request.GET), {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)


@csrf_exempt
def search_download(request):
    if request.method != "GET":
        error_response = {"error": "Only GET allowed"}
        log_api_response("search_download", request.method, dict(request.GET), error_response)
        return JsonResponse(error_response, status=405)

    user, err = require_auth(request)
    if err:
        return err

    try:
        params = request.GET
        query = _build_search_query(params)
        docs = list(collection.find(query))

        # Create CSV content
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header row
        writer.writerow([
            "Pass No", "Project Name", 
            "Customer Name", "Customer Unit Address", "Customer Location", "Customer Phone",
            "Equipment Type", "Item Name", "Part Number", "Serial Number", "Defect Details", 
            "Status", "Date In", "Date Out", "Item Rectification Details", "CreatedBy", "updatedBy"
        ])
        
        # Write data rows - one row per item
        for doc in docs:
            pass_no = doc.get("passNo", "")
            date_in = doc.get("dateIn", "")
            project_name = doc.get("projectName", "")
            customer = doc.get("customer", {})
            items = doc.get("items", [])
            createdBy = doc.get("createdBy", "")
            updatedBy = doc.get("updatedBy", "")
            
            # Filter items by part number if searching by part number
            search_type = params.get("type")
            if search_type == "ItemPartNo" and params.get("value"):
                items = _filter_items_by_part_number(items, params.get("value"))
            
            for item in items:
                # Determine status: OUT if both itemIn and itemOut are true, else IN
                status = "OUT" if item.get("itemIn") and item.get("itemOut") else "IN"
                
                # Format phone number properly (remove scientific notation)
                phone = customer.get("phone", "")
                if phone and str(phone).isdigit():
                    phone = str(phone)
                
                # Format date properly for Excel
                date_out = item.get("dateOut", "")
                if date_out:
                    # Ensure date is in YYYY-MM-DD format
                    try:
                        if isinstance(date_out, str):
                            date_out = date_out[:10]  # Take first 10 characters
                    except:
                        date_out = ""
                
                writer.writerow([
                    pass_no,
                    project_name,
                    customer.get("name", ""),
                    customer.get("unitAddress", ""),
                    customer.get("location", ""),
                    phone,
                    item.get("equipmentType", ""),
                    item.get("itemName", ""),
                    item.get("partNumber", ""),
                    item.get("serialNumber", ""),
                    item.get("defectDetails", ""),
                    status,
                    date_in,
                    date_out,
                    item.get("itemRectificationDetails", ""),
                    createdBy,
                    updatedBy
                ])

        csv_content = output.getvalue()
        output.close()
        
        # Return CSV file
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory_export.csv"'
        
        log_api_response("search_download", request.method, dict(params), {"rows": len(docs)})
        return response

    except Exception as e:
        stack_trace = traceback.format_exc()
        error_response = {"error": str(e)}
        log_api_response("search_download", request.method, dict(request.GET), {**error_response, "stack_trace": stack_trace})
        return JsonResponse(error_response, status=500)