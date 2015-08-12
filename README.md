# isee-delve
Pilot Project - Visualization of search results

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
- Documents: Medline index of 1,118,632 documents from 'Abridged Index Medicus (AIM or "Core Clinical") Journal Titles' by excluding all documents without an abstract.
```
"mappings" : {
      "aim-core" : {
        "properties" : {
          "abstract" : {
            "type" : "string",
            "store" : true,
            "term_vector" : "with_positions_offsets"
          },
          "article_type" : {
            "type" : "string",
            "index" : "not_analyzed",
            "store" : true
          },
          "journal_abbrev" : {
            "type" : "string",
            "index" : "not_analyzed",
            "store" : true
          },
          "journal_issue" : {
            "type" : "string",
            "index" : "no",
            "store" : true
          },
          "journal_page" : {
            "type" : "string",
            "index" : "no",
            "store" : true
          },
          "journal_title" : {
            "type" : "string",
            "index" : "not_analyzed",
            "store" : true
          },
          "journal_volume" : {
            "type" : "string",
            "index" : "no",
            "store" : true
          },
          "mesh" : {
            "type" : "string",
            "index" : "not_analyzed",
            "store" : true,
            "position_offset_gap" : 100
          },
          "pmid" : {
            "type" : "string",
            "index" : "not_analyzed",
            "store" : true
          },
          "title" : {
            "type" : "string",
            "store" : true,
            "term_vector" : "with_positions_offsets"
          },
          "year" : {
            "type" : "date",
            "store" : true,
            "format" : "YYYY"
          }
        }
      }
    }
```
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
- Update the settings.py file with the server settings
- Update the wsgi.py file with the server settings
- Update the views.py file with teh elasticsearch index parameters

# Elasticsearch node requirements

isee-devle interface requires at least
- one string field that is anlyzed with term_vectors sets to position and offsets. This is the primary text field that is used for keyword cloud, document graphs.
- one string field that is not analyzed. This is used as facets

Edit the appropriate query in the views.py to connect to the elasticsearch node. Any changes made to the processing of returned results in views.py file, must also be complemented in the search.js file.
