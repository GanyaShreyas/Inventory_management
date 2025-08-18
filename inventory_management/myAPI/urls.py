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
]
