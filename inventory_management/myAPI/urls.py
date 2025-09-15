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

    # search
    path('search', views.search),  # GET /api/search
    path('search/download', views.search_download),  # GET /api/search/download

    # Admin Projects
    path('admin/projects/add', views.admin_add_project),  # POST /api/admin/projects/add
    path('admin/projects/items/add', views.admin_add_item),  # POST /api/admin/projects/items/add
    path('admin/projects/items/edit', views.admin_edit_item),  # PUT /api/admin/projects/items/edit
    path('admin/projects/items/delete', views.admin_delete_item),  # DELETE /api/admin/projects/items/delete
    path('admin/projects/list', views.admin_get_projects),  # GET /api/admin/projects/list
    path('admin/projects/items', views.admin_get_project_items),  # GET /api/admin/projects/items?projectName=...
]
