from django.urls import path
from . import views

urlpatterns = [
    # auth and admin
    path('login', views.login),  # POST /api/login
    path('validate-token', views.validate_token),  # GET /api/validate-token
    path('logout', views.logout),  # POST /api/logout
    path('admin/users', views.admin_add_user),  # POST /api/admin/users

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

    # Admin Projects
    path('admin/projects/add', views.admin_add_project),  # POST /api/admin/projects/add
    path('admin/projects/items/add', views.admin_add_item),  # POST /api/admin/projects/items/add
    path('admin/projects/items/edit', views.admin_edit_item),  # PUT /api/admin/projects/items/edit
    path('admin/projects/items/delete', views.admin_delete_item),  # DELETE /api/admin/projects/items/delete
    path('admin/projects/list', views.admin_get_projects),  # GET /api/admin/projects/list
    path('admin/projects/items', views.admin_get_project_items),  # GET /api/admin/projects/items?projectName=...

    # spares management
    path("spares/master/add", views.spares_master_add), # POST /spares/master 
    path("spares/in", views.spares_in), # POST /spares/in 
    path("spares/master", views.spares_master_list),  # GET /spares/master
    path("spares/out", views.spares_out), # POST /spares/out
    path("spares/audit", views.spares_audit_view), # GET /spares/audit
    path("spares/stock", views.stock_check), # GET /spares/stock
    path("spares/audit/filter", views.spares_audit_filter),  # GET /spares/audit/filter
]
