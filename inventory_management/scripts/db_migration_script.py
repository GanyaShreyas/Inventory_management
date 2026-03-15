import pandas as pd
import json
import numpy as np
from datetime import datetime

# --- Configuration ---
CSV_FILE_PATH = 'OVERALL.csv'
OUTPUT_FILE_PATH = 'mongodb_bulk_import.json'
# ---------------------

def transform_data(csv_file_path, output_file_path):
    print(f"Starting transformation from {csv_file_path}...")

    try:
        df = pd.read_csv(csv_file_path)
    except FileNotFoundError:
        print(f"Error: File '{csv_file_path}' not found.")
        return
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    # Replace placeholders with NaN
    df.replace(['NA', 'N/A', '-', '-------', '--------', '', ' '], np.nan, inplace=True)

    # Clean column names
    df.columns = df.columns.str.strip()

    now_iso = datetime.utcnow().isoformat() + 'Z'

    mongo_documents = []

    for pass_no, group in df.groupby('Pass No'):
        first_row = group.iloc[0]

        items_list = []
        for _, row in group.iterrows():
            status = str(row['Status']).strip().upper() if pd.notna(row['Status']) else ''
            item_out_flag = status == 'OUT'
            date_out_value = row['Date Out'] if item_out_flag and pd.notna(row['Date Out']) else None

            item = {
                "equipmentType": safe_str(row.get('Equipment Type')),
                "itemName": safe_str(row.get('Item Name')),
                "partNumber": safe_str(row.get('Part Number')),
                "serialNumber": safe_str(row.get('Serial Number')),
                "defectDetails": safe_str(row.get('Defect Details')),
                "itemIn": True,
                "itemOut": item_out_flag,
                "dateOut": format_short_date(date_out_value),
                "itemRectificationDetails": safe_str(row.get('Item Rectification Details')),
            }
            items_list.append(remove_nulls(item))

        document = {
            "passNo": safe_str(pass_no),
            "dateIn": format_short_date(first_row.get('Date In')) or datetime.utcnow().strftime("%Y-%m-%d"),
            "customer": remove_nulls({
                "name": safe_str(first_row.get('Customer Name')),
                "unitAddress": safe_str(first_row.get('Customer Unit Address')),
                "location": safe_str(first_row.get('Customer Location')),
                "phone": safe_str(first_row.get('Customer Phone')),
            }),
            "projectName": safe_str(first_row.get('Project Name')),
            "items": items_list,
            "createdBy": safe_str(first_row.get('CreatedBy')) or "Bulk_Import_Script",
            "updatedBy": safe_str(first_row.get('updatedBy')) or "Bulk_Import_Script",
            "createdAt": format_short_date(first_row.get('CreatedAt')) or {"$date": now_iso},
            "updatedAt": format_short_date(first_row.get('UpdatedAt')) or {"$date": now_iso},
        }

        mongo_documents.append(remove_nulls(document))

    # Clean NaN recursively across the structure
    mongo_documents = clean_for_json(mongo_documents)

    with open(output_file_path, 'w', encoding='utf-8') as f:
        json.dump(mongo_documents, f, indent=2)

    print(f"\n✅ Transformation complete!")
    print(f"Created {len(mongo_documents)} MongoDB documents.")
    print(f"Output saved to: {output_file_path}")

# --- Helper functions ---

def safe_str(val):
    """Converts value to string or None if empty/NaN."""
    if pd.isna(val):
        return None
    if isinstance(val, (float, int)) and np.isfinite(val):
        if val.is_integer():
            return str(int(val))
    return str(val).strip() if val is not None else None

def format_short_date(val):
    """Converts to short yy-mm-dd string, or None."""
    if pd.isna(val) or not val:
        return None
    try:
        dt = pd.to_datetime(val)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


# def format_mongo_date(val):
#     if pd.isna(val):
#         return None
#     try:
#         dt = pd.to_datetime(val)
#         return {"$date": dt.strftime("%Y-%m-%dT%H:%M:%SZ")}
#     except Exception:
#         return None

def remove_nulls(d):
    """Removes keys with None or NaN values from dicts."""
    if isinstance(d, dict):
        return {k: remove_nulls(v) for k, v in d.items() if v is not None and not (isinstance(v, float) and np.isnan(v))}
    elif isinstance(d, list):
        return [remove_nulls(v) for v in d]
    else:
        return d

def clean_for_json(obj):
    """Ensures no NaN, inf, or invalid types remain."""
    if isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    return obj

# --- Run ---
if __name__ == "__main__":
    transform_data(CSV_FILE_PATH, OUTPUT_FILE_PATH)




# import pandas as pd
# import json
# import numpy as np
# from datetime import datetime

# # --- Configuration ---
# # NOTE: Ensure this path matches the location of your uploaded CSV file.
# # The user provided the file name 'OVERALL.xlsx - Sheet1.csv'.
# CSV_FILE_PATH = 'OVERALL.csv'
# OUTPUT_FILE_PATH = 'mongodb_bulk_import.json'
# # ---------------------

# def transform_data(csv_file_path, output_file_path):
#     """
#     Reads a flat CSV/Excel-like file, groups rows by 'Pass No', and transforms 
#     them into a nested MongoDB document structure.
#     """
#     print(f"Starting transformation from {csv_file_path}...")
    
#     try:
#         # 1. Read the CSV file
#         df = pd.read_csv(csv_file_path)
#     except FileNotFoundError:
#         print(f"Error: The file '{csv_file_path}' was not found.")
#         print("Please check the CSV_FILE_PATH configuration.")
#         return
#     except Exception as e:
#         print(f"An error occurred while reading the CSV: {e}")
#         return

#     # 2. Standardize data: Convert placeholder values to NaN for easier handling
#     # Common placeholders found in Excel/CSV data are converted to a standard null type (np.nan)
#     df.replace(['NA', 'N/A', '-', '-------', '--------', ''], np.nan, inplace=True)
    
#     # Clean up column names by removing extra spaces
#     df.columns = df.columns.str.strip()

#     # Get the current time for the creation/update timestamps
#     now_iso = datetime.utcnow().isoformat() + 'Z'
    
#     # 3. Group by 'Pass No'
#     # We use a custom aggregation to build the nested structure
#     mongo_documents = []

#     # Iterate over each group (which represents one MongoDB document)
#     for pass_no, group in df.groupby('Pass No'):
#         # Get the first row of the group to extract non-item-specific fields 
#         # (Pass No, Customer details, Project Name, CreatedBy, etc.)
#         first_row = group.iloc[0]
        
#         # --- Build the 'items' array from all rows in the group ---
#         items_list = []
#         for _, row in group.iterrows():
#             # Determine itemIn and itemOut status based on the 'Status' column
#             status = str(row['Status']).strip().upper() if pd.notna(row['Status']) else ''
            
#             item_out_flag = status == 'OUT'
            
#             # Use the value from 'Date Out' if item is OUT, otherwise null
#             date_out_value = row['Date Out'] if item_out_flag and pd.notna(row['Date Out']) else None
            
#             # Handle item name potentially being null/NaN
#             item_name = row['Item Name']
#             if isinstance(item_name, str):
#                  item_name = item_name.strip()
            
#             item = {
#                 "equipmentType": str(row['Equipment Type']).strip() if pd.notna(row['Equipment Type']) else None,
#                 "itemName": item_name,
#                 "partNumber": str(row['Part Number']).strip() if pd.notna(row['Part Number']) else None,
#                 "serialNumber": str(row['Serial Number']).strip() if pd.notna(row['Serial Number']) else None,
#                 "defectDetails": str(row['Defect Details']).strip() if pd.notna(row['Defect Details']) else None,
#                 "itemIn": True,  # Based on your data, all items are IN initially
#                 "itemOut": item_out_flag,
#                 # Format Date Out as required by MongoDB (or null)
#                 "dateOut": date_out_value, 
#                 "itemRectificationDetails": str(row['Item Rectification Details']).strip() if pd.notna(row['Item Rectification Details']) else "",
#             }
#             # Remove keys where the value is None to keep the structure clean
#             items_list.append({k: v for k, v in item.items() if v is not None})
        
#         # --- Build the top-level MongoDB document ---
#         document = {
#             # MongoDB can auto-generate the _id, so we omit it for bulk insert
#             "passNo": str(pass_no).strip(),
            
#             # Assuming 'Date In' is consistent for all items in a pass
#             "dateIn": str(first_row['Date In']).strip() if pd.notna(first_row['Date In']) else now_iso.split('T')[0],
            
#             "customer": {
#                 "name": str(first_row['Customer Name']).strip() if pd.notna(first_row['Customer Name']) else "Unknown",
#                 "unitAddress": str(first_row['Customer Unit Address']).strip() if pd.notna(first_row['Customer Unit Address']) else None,
#                 "location": str(first_row['Customer Location']).strip() if pd.notna(first_row['Customer Location']) else None,
#                 "phone": str(first_row['Customer Phone']).strip() if pd.notna(first_row['Customer Phone']) else None,
#             },
            
#             "projectName": str(first_row['Project Name']).strip() if pd.notna(first_row['Project Name']) else None,
#             "items": items_list,
            
#             # Audit fields (using current time as MongoDB date objects)
#             "createdBy": str(first_row['CreatedBy']).strip() if pd.notna(first_row['CreatedBy']) else "Bulk_Import_Script",
#             "updatedBy": str(first_row['updatedBy']).strip() if pd.notna(first_row['updatedBy']) else "Bulk_Import_Script",
#             "createdAt": format_mongo_date(first_row.get('CreatedAt')),
#             "updatedAt": format_mongo_date(first_row.get('UpdatedAt')),
#         }

#         # Final cleanup: Remove customer keys if values were null/None
#         document['customer'] = {k: v for k, v in document['customer'].items() if v is not None}
        
#         mongo_documents.append(document)

#     # 4. Write the resulting list of documents to a JSON file
#     # MongoDB Compass expects an array of documents for bulk insert
#     with open(output_file_path, 'w', encoding='utf-8') as f:
#     # Convert all NaN/None safely
#         mongo_documents = json.loads(json.dumps(mongo_documents, default=str))
#         json.dump(mongo_documents, f, indent=2, ensure_ascii=False)

#     print(f"\nTransformation complete!")
#     print(f"Successfully created {len(mongo_documents)} MongoDB documents.")
#     print(f"Output saved to: {output_file_path}")

# def format_mongo_date(val):
#     if pd.isna(val):
#         return None
#     # Ensure string format YYYY-MM-DDTHH:MM:SSZ
#     try:
#         dt = pd.to_datetime(val)
#         return {"$date": dt.strftime("%Y-%m-%dT%H:%M:%SZ")}
#     except:
#         return None

# if __name__ == "__main__":
#     # If you need to run this outside of an environment where pandas is installed:
#     # pip install pandas
#     transform_data(CSV_FILE_PATH, OUTPUT_FILE_PATH)