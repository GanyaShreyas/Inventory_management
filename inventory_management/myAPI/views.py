from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from pymongo import MongoClient
import traceback
from datetime import datetime

# Set up MongoDB connection (adjust URI as needed)
client = MongoClient("mongodb://inventory_admin:BEL%402479@localhost:27017/")
db = client["inventory_db"]  # Use your DB name
collection = db["product_details"]
log_collection = db["api_logs"]

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


def fetch_items(request):
    if request.method == "GET":
        try:
            product_id = request.GET.get("product_id")
            query = {"product_id": product_id} if product_id else {}
            items = list(collection.find(query, {"_id": 0}))
            log_api_response(
                endpoint="fetch_items",
                method=request.method,
                request_data={"product_id": product_id},
                response_data=items
            )
            return JsonResponse(items, safe=False)
        except Exception as e:
            stack_trace = traceback.format_exc()
            error_response = {"error": str(e)}
            log_api_response(
                endpoint="fetch_items",
                method=request.method,
                request_data={"product_id": product_id},
                response_data={**error_response, "stack_trace": stack_trace}
            )
            return JsonResponse(error_response, status=500)
    else:
        error_response = {"error": "Only GET method Allowed"}
        log_api_response(
            endpoint="fetch_items",
            method=request.method,
            request_data={},
            response_data=error_response
        )
        return JsonResponse(error_response, status=405)


@csrf_exempt
def insert_item(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            # Extract all fields from the frontend form
            product_items = {
                "name": data.get("name"),
                "in": data.get("in"),
                "out": data.get("out"),
                "field1": data.get("field1"),
                "field2": data.get("field2"),
                "field3": data.get("field3"),
                "field4": data.get("field4"),
                "field5": data.get("field5"),
                "field6": data.get("field6"),
                "field7": data.get("field7"),
                "field8": data.get("field8") or datetime.utcnow().strftime("%Y-%m-%d"),
            }

            # Insert into MongoDB
            result = collection.insert_one(product_items)

            product_items.pop("_id",None) 
            response = {
                "message": "Item added successfully",
                "product": product_items,
                "mongo_id": str(result.inserted_id)
            }
            log_api_response(
                endpoint="insert_item",
                method=request.method,
                request_data=data,
                response_data=response
            )
            return JsonResponse(response)

        except Exception as e:
            print("Error in insert_item:", e)
            traceback.print_exc()
            stack_trace = traceback.format_exc()
            error_response = {"error": str(e)}
            log_api_response(
                endpoint="insert_item",
                method=request.method,
                request_data=getattr(request, 'body', None),
                response_data={**error_response, "stack_trace": stack_trace}
            )
            return JsonResponse(error_response, status=500)
    else:
        error_response = {"error": "Only POST allowed"}
        log_api_response(
            endpoint="insert_item",
            method=request.method,
            request_data=getattr(request, 'body', None),
            response_data=error_response
        )
        return JsonResponse(error_response, status=405)


@csrf_exempt
def update_item(request):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            product_name = data.get("product_name")
            product_id = data.get("product_id")

            result = collection.update_one(
                {"product_id": product_id},
                {"$set": {"product_name": product_name}}
            )
            if result.matched_count == 0:
                response = {"message": f"Item with product_id {product_id} does not exist"}
            else:
                response = {"message": "Item updated successfully"}
            log_api_response(
                endpoint="update_item",
                method=request.method,
                request_data=data,
                response_data=response
            )
            return JsonResponse(response)
        except Exception as e:
            stack_trace = traceback.format_exc()
            error_response = {"error": str(e)}
            log_api_response(
                endpoint="update_item",
                method=request.method,
                request_data=getattr(request, 'body', None),
                response_data={**error_response, "stack_trace": stack_trace}
            )
            return JsonResponse(error_response, status=500)
    else:
        error_response = {"error": "Only PUT method allowed"}
        log_api_response(
            endpoint="update_item",
            method=request.method,
            request_data=getattr(request, 'body', None),
            response_data=error_response
        )
        return JsonResponse(error_response, status=405)


@csrf_exempt
def delete_item(request):
    if request.method == "DELETE":
        try:
            data = json.loads(request.body)
            product_id = data.get("product_id")

            result = collection.delete_one({"product_id": product_id})
            if result.deleted_count == 0:
                response = {"message": f"Item with product_id {product_id} does not exist"}
            else:
                response = {"message": f"Item with product_id {product_id} is deleted successfully"}
            log_api_response(
                endpoint="delete_item",
                method=request.method,
                request_data=data,
                response_data=response
            )
            return JsonResponse(response)
        except Exception as e:
            stack_trace = traceback.format_exc()
            error_response = {"error": str(e)}
            log_api_response(
                endpoint="delete_item",
                method=request.method,
                request_data=getattr(request, 'body', None),
                response_data={**error_response, "stack_trace": stack_trace}
            )
            return JsonResponse(error_response, status=500)
    else:
        error_response = {"error": "Only DELETE method allowed"}
        log_api_response(
            endpoint="delete_item",
            method=request.method,
            request_data=getattr(request, 'body', None),
            response_data=error_response
        )
        return JsonResponse(error_response, status=405)