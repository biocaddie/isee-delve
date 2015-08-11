from django.conf.urls import patterns, url
#from django.conf.urls import include
#from django.contrib import admin
from iseedelve import views

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'iseedee.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url (r'^$', views.home, name='home'),
    
    url (r'^generate_facets/', views.generate_facets, name='generate_facets'),  
    url (r'^keywords/', views.send_keywords, name='send_keywords'),
    url (r'^relevant_facets/', views.send_relevant_facets, name='send_relevant_facets'), 
    url (r'^document_graph/', views.document_graph, name='document_graph'),
    url (r'^search_query/', views.search_query, name='search_query'),  
    url (r'^document_list/', views.document_list, name='document_list'),  
       
    #url(r'^admin/', include(admin.site.urls)),
)
