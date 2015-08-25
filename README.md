# isee-delve
PP2.2 - Intelligent Search expansion and Visualization of Datasets (iSee-DELVE)

This is the DELVE component (Visualization part) of the project.

#Setup

###Server Side:
- Pytyhon3.4 (with Numpy and Scipy modules)
- Django 1.7

###Client Side:
- HTML5
- Jquery 1.11.2
- Jquery-Ui
- Jquery-Ui-contextmenu
- D3
- D3.layoud.cloud

###Search Index:
- Elasticsearch server 1.6
- Tested on PDB index and Medline Index
- PDB Index: As provided by UCSD team.=
- Medline Index: Medline index of 1,118,632 documents from 'Abridged Index Medicus (AIM or "Core Clinical") Journal Titles' by excluding all documents without an abstract.
- Mapping requirements
-- One "string" type with "term_vector" : "with_position_offsets" - usually a field that has maxium text or create a field with merging multiple small fields. This is required for document graph generation
-- Facets must be "string" type with "index" : "not_analyzed"
-- Year / Date fields must not be "string" type. Use appropriate "date" format from elasticsearch
-- "store" : "true" must be set for all fields, as the interface displays text directly from the elasticsearch (instead of querying a sepearate database)

# Implementation - Things to do

- The iseedelve folder has the django folder structure. Import the folder to http server root (such as /var/www/html/). After importing the folder structure must be like the following (not all folders and files are shown below)
```
-/var
  |_ /wwww
      |_ /html
            |_/iseedelve
                  |_/iseedelve
                  |     |_/media
                  |     |_/static
                  |     |_/template
                  |     |_urls.py
                  |     |_views.py
                  |     |_wsgi.py
                  |_manage.py
```
- Update the search.js file with the index settings
- Update the settings.py file with the server settings
- Update the wsgi.py file with the server settings
- Update the views.py file with the elasticsearch index parameters and search fields

# Elasticsearch node requirements

isee-devle interface requires at least
- one string field that is anlyzed with term_vectors sets to position and offsets. This is the primary text field that is used for keyword cloud, document graphs.
- one string field that is not analyzed. This is used as facets

Edit the appropriate query in the views.py to connect to the elasticsearch node. Any changes made to the processing of returned results in views.py file, must also be complemented in the search.js file.

THe sample mapping of Medline and PDB index is uploaded.

The current uploaded version (25-August-2015) will work with Medline and PDB index.
