from django.urls import path
from . import views

urlpatterns = [
    # auth and admin
    path('login', views.login),  # POST /api/login
    path('validate-token', views.validate_token),  # GET /api/validate-token
    path('logout', views.logout),  # POST /api/logout
    path('admin/users', views.admin_add_user),  # POST /api/admin/users
    path('admin/users/list', views.admin_list_users),  # GET /api/admin/users/list
    path('admin/users/edit', views.admin_edit_user),  # PUT /api/admin/users/edit
    path('admin/users/delete', views.admin_delete_user),  # DELETE /api/admin/users/delete
    path('admin/users/reset-password', views.admin_reset_password),  # POST
    path('user/change-password', views.user_change_password),  # POST

    # item in/out and CRUD by passNo
    path('items/in', views.items_in),  # POST /api/items/in
    path('items/<str:pass_no>', views.edit_record),  # GET/PUT/DELETE /api/items/:passNo
    path('items/out/<str:pass_no>', views.update_item_out),  # PUT /api/items/out/:passNo
    path('items/rfd/<str:pass_no>', views.update_item_rfd),  # PUT /api/items/rfd/:passNo

    # search
    path('search', views.search),  # GET /api/search
    path('search/download', views.search_download),  # GET /api/search/download
    path('search/suggestions', views.search_suggestions),  # GET /api/search/suggestions
    path('search/download_sticker', views.search_download_sticker),
    path('search/download_form', views.search_download_form),
    path('search/download_acknowledgement', views.search_download_acknowledgement),

    # OBD management
    path('obd/out', views.obd_out),  # POST /api/obd/out
    path('obd/suggestions', views.obd_suggestions),  # GET /api/obd/suggestions?value=...
    path('obd/<int:obd_no>', views.obd_record),  # GET/PUT /api/obd/:obdNo
    path('obd/status', views.obd_status),  # GET /api/obd/status
    path('obd/status/download', views.obd_status_download),  # GET /api/obd/status/download

    # Admin Projects
    path('admin/projects/add', views.admin_add_project),  # POST /api/admin/projects/add
    path('admin/projects/items/add', views.admin_add_item),  # POST /api/admin/projects/items/add
    path('admin/projects/items/edit', views.admin_edit_item),  # PUT /api/admin/projects/items/edit
    path('admin/projects/items/delete', views.admin_delete_item),  # DELETE /api/admin/projects/items/delete
    path('admin/projects/list', views.admin_get_projects),  # GET /api/admin/projects/list
    path('admin/projects/items', views.admin_get_project_items),  # GET /api/admin/projects/items?projectName=...

    # Admin Backup (MongoDB)
    path('admin/backup', views.admin_backup_mongo),  # GET /api/admin/backup

    # spares management
    path("spares/master/add", views.spares_master_add),  # POST — admin only
    path("spares/master/update", views.spares_master_update),  # PUT — admin only
    path("spares/master/delete", views.spares_master_delete),  # DELETE — admin only
    path("spares/master/search", views.spares_master_search),  # GET ?pattern=
    path("spares/stores", views.spares_stores_list),  # GET — dropdown list
    path("admin/stores/add", views.admin_stores_add),
    path("admin/stores/edit", views.admin_stores_edit),
    path("admin/stores/list", views.admin_stores_list),
    path("spares/in", views.spares_in), # POST /spares/in 
    path("spares/master", views.spares_master_list),  # GET /spares/master
    path("spares/out", views.spares_out), # POST /spares/out
    path("spares/returnable/next-service-request", views.spares_returnable_next_service_request),  # GET
    path("spares/out-returnable", views.spares_out_returnable),  # POST
    path("spares/out-returnable/list", views.spares_out_returnable_list),  # GET
    path("spares/out-returnable/<int:service_request_no>", views.spares_out_returnable_record),  # GET
    path("spares/out-returnable/download-form", views.spares_out_returnable_download_form),  # GET
    path("spares/in-returned", views.spares_in_returned),  # POST
    path("spares/audit", views.spares_audit_view), # GET /spares/audit
    path("spares/stock", views.stock_check), # GET /spares/stock
    path("spares/audit/filter", views.spares_audit_filter),  # GET /spares/audit/filter

    # Configuration Management
    path("config/add", views.config_add),  # POST /api/config/add
    path("config/get", views.config_get),  # GET /api/config/get
    path("config/list", views.config_list),  # GET /api/config/list
]
