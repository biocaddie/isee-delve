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
