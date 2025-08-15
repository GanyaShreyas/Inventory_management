from django.urls import path
from . import views

urlpatterns = [
    path('items/', views.fetch_items),
    path('items/add/', views.insert_item),
    path('items/update/', views.update_item),
    path('items/delete/', views.delete_item)
]
