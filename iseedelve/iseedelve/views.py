import math, json
import scipy.spatial as sp
import numpy as np
from elasticsearch import Elasticsearch
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt

def home(request):
    return HttpResponseRedirect("/pubmed")

def index(request, index_name):
    return render(request, "design.html", {})
    
def generate_elastic(index):
    esnodes = {'pubmed':{'host': '127.0.0.1', 'port': 9200}, 'pdb_v2': {'host': '129.106.149.72', 'port': 9200}}
    es = Elasticsearch([esnodes[index]], timeout=600, index=index)
    return es

def get_index(post_raw):
    """the elasticsearch index"""
    body_str = ((post_raw.body).decode('utf-8'))
    post_data = json.loads(body_str)
    index = post_data.get('index')
    doc_type = post_data.get('doc_type')
    return index, doc_type

def get_document_title_field(index,doc_type):
    """Returns document title field"""
    title_fields = {'pubmed': {'main': 'title'}, 'pdb_v2': {'main': 'dataItem', 'sub': 'title'}}
    return title_fields[index]
    
def get_url_field(index,doc_type):
    """Returns document URL identifier field"""
    url_fields = {'pubmed': {'main': 'pmid'}, 'pdb_v2': {'main':'dataItem', 'sub': 'ID'}}
    return url_fields[index]

def get_tv_field(index,doc_type):
    """Returns term vector fields"""
    tv_fields = {'pubmed': {'main': 'abstract'}, 'pdb_v2': {'main': 'dataResource.freeText'}}
    return tv_fields[index]
    
def get_kw_field(index,doc_type):
    """Returns fields for keyword cloud"""
    kw_fields = {'pubmed': 'abstract','pdb_v2': 'dataResource.freeText'}
    return kw_fields[index]

def get_desc_field_list(index,doc_type):
    """Returns fields with description test"""
    desc_fields = {'pubmed': ['abstract'], 'pdb_v2': ['dataResource.freeText']}
    return desc_fields[index]

def get_agg_dict(index,doc_type):
    """Returns Aggregations (facets) fields for order and name
    agg_name : [TItle Text, Order of appearance, type of aggrepation, field name]
    """
    agg_fields = {'pubmed': {"article_type" : ["Article Type",0, "terms", "article_type"], 
                        "journal" : ["Journal Title",1,"terms", "journal_abbrev"],
                        "year_range" : ["Publication Year" , 2,"range", "year"],
                        "mesh" : ["MeSH",3,"terms", "mesh"]},

                'pdb_v2': { 
                            "data_keywords" : ["Keyword",0,"terms", "dataItem.keywords"],
                        "citation_journal" : ["Journal Title",1,"terms", "citation.journal"],
                        "citiation_year" : ["Publication Year" , 2,"range", "citation.year"],
                        "organism_host" : ["Host Organism" , 3,"terms", "organism.host.genus"],
                        "organism_source" : ["Source Organism" , 4,"terms", "organism.source.genus"],
                        "material_entity" : ["Materials" , 5,"terms", "materialEntity.name"]
                        }
                }
    return agg_fields[index]

def get_agg_fields(index,doc_type):
    """Returns Aggreations (facets) fields for query"""
    agg_fields = {'pubmed' : {
                     "article_type" : {"terms" : {'field' : 'article_type', 'size' : 10 }},
                    "year_range" : {"date_range" : {'field' : 'year', 'ranges' : [{"from": "now-5y"},
                                                                                  {"from": "now-10y", "to": "now-5y"},
                                                                                  {"from": "now-15y", "to": "now-10y"},
                                                                                 {"from": "now-20y", "to": "now-15y"},
                                                                                 {"to": "now-20y"}]}},
                     "journal" : {"terms" : {'field' : 'journal_abbrev', 'size' : 10 }},
                     "mesh" : {"terms" : {'field' : 'mesh', 'size' : 10 }}
                     },
                     
                'pdb_v2' : {
                    "data_keywords" : {"terms" : {'field' : 'dataItem.keywords', 'size' : 10 }},
                     "citation_journal" : {"terms" : {'field' : 'citation.journal', 'size' : 10 }},
                    "citiation_year" : {"date_range" : {'field' : 'citation.year', 'ranges' : [{"from": "now-5y"},
                                                                                  {"from": "now-10y", "to": "now-5y"},
                                                                                  {"from": "now-15y", "to": "now-10y"},
                                                                                 {"from": "now-20y", "to": "now-15y"},
                                                                                 {"to": "now-20y"}]}},
                     "organism_host" : {"terms" : {'field' : 'organism.host.genus', 'size' : 10 }},
                    "organism_source" : {"terms" : {'field' : 'organism.source.genus', 'size' : 10 }},
                    "material_entity" : {"terms" : {'field' : 'materialEntity.name', 'size' : 10 }}
                     }
                }
    return agg_fields[index]

def get_sig_agg(index,doc_type):
    """Returns Significant Facets fields for query"""
    agg_fields = {'pubmed': {"significantArticle" : {"significant_terms" : { "field" : "article_type"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["pmid"]},"size" : 100}}}
                                      },
                "significantJournal" : {"significant_terms" : { "field" : "journal_abbrev"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["pmid"]},"size" : 100}}}
                                      },
                "significantMesh" : {"significant_terms" : { "field" : "mesh"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["pmid"]},"size" : 100}}}
                                      },
                "significantYear" : {"significant_terms" : { "field" : "year"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["pmid"]},"size" : 100}}}
                                      }
                            },
                            
                 'pdb_v2' : {
                              "significantKeywords" : {"significant_terms" : { "field" : "dataItem.keywords"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["dataItem.ID"]},"size" : 100}}}
                                      },    
                             "significantCitationJournal" : {"significant_terms" : { "field" : "citation.journal"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["dataItem.ID"]},"size" : 100}}}
                                      },  
                            "significantCitationYear" : {"significant_terms" : { "field" : "citation.year"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["dataItem.ID"]},"size" : 100}}}
                                      },
                             "significantHost" : {"significant_terms" : { "field" : "organism.host.genus"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["dataItem.ID"]},"size" : 100}}}
                                      },
                             "significantSource" : {"significant_terms" : { "field" : "organism.source.genus"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["dataItem.ID"]},"size" : 100}}}
                                      },
                            "significantMaterial" : {"significant_terms" : { "field" : "materialEntity.name"},
                                      "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["dataItem.ID"]},"size" : 100}}}
                                      }  
                                      }
                    }    
    return agg_fields[index]

def get_sig_agg_names (index, doc_type):
    """Returns Significant Facets names for display """
    agg_fields = {'pubmed': {"significantArticle" : "Article Type", "significantJournal" : "Journal Title", "significantYear" : "Publication Year", "significantMesh" : "MeSH"},
                  'pdb_v2' : {"significantDepositYear" : "Deposit Year", 
                              "significantReleaseYear" : 'Release Year',
                              "significantKeywords" : 'Keyword',    
                             "significantCitationJournal" : 'Citation Journal',  
                            "significantCitationYear" : 'Citation Year',
                             "significantHost" : 'Host Organism',
                             "significantSource" : 'Source Organism',
                            "significantMaterial" : 'Material'},
                  
                  }
    return agg_fields[index]
    
def get_sig_agg_fields (index, doc_type):
    """Returns Significant Facets fields for coding """
    agg_fields = {'pubmed': {"significantArticle" : "article_type", "significantJournal" : "journal_abbrev", "significantYear" : "year", "significantMesh" : "mesh"},
                 'pdb_v2' : {"significantDepositYear" : "dataItem.depositionDate", 
                             "significantReleaseYear" : 'dataItem.releaseDate',
                              "significantKeywords" : 'dataItem.keywords',    
                             "significantCitationJournal" : 'citation.journal',  
                            "significantCitationYear" : 'citation.year',
                             "significantHost" : 'organism.host.genus',
                             "significantSource" : 'organism.source.genus',
                            "significantMaterial" : 'materialEntity.name'},
                 }
    return agg_fields[index]
    
def get_sig_keys(index, doc_type):
    """Returns Significant Keywords fields for query"""
    agg_fields = {'pubmed': {
                         "significantKeys" : { "significant_terms" : { "field" : "abstract", "size" : "100"},
                                              "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["pmid"]},"size" : 100}}}
                                              }
                                },
                  'pdb_v2': {
                         "significantKeys" : { "significant_terms" : { "field" : 'dataResource.freeText', "size" : "100"},
                                              "aggregations" : {"top_articles" : {"top_hits":{"_source": {"include": ["dataItem.ID"]},"size" : 100}}}
                                              }
                                }
                                }    
    return agg_fields[index]
    
def do_search(es, query, index, doc_type):
	return es.search(index=index, doc_type=doc_type, body=query)
	
def get_distance_angle(vec1, vec2):
    """
    Takes 2 vectors vec1 and vec2, calculates cosine similarity and thus angle, and then eculedian distance.
    """
    counter = set(list(vec1.keys())+list(vec2.keys()))
    a = []
    b = []
    for x in counter:
        if x in vec1:
            a.append(vec1[x])
        else:
            a.append(0)
        
        if x in vec2:
            b.append(vec2[x])
        else:
            b.append(0) 
    return np.arccos(np.clip(np.dot((a/np.linalg.norm(a)), (b/np.linalg.norm(b))),-1,1)),sp.distance.euclidean(a,b)

def generate_document_graph(response_dict):

    """Generates SVG data of document plot"""
    
    svg = ""
    top_doc = response_dict['top_doc']
    doc_matrix = response_dict['doc_matrix']
    
    #Coordinates of ViewBox
    b = 400 #viewbox width
    bin_width = 40
    max_distance = response_dict['max_dis'] + 5
    
    dmin = 0
    dmax = max_distance
    sdmin = 0
    sdmax = 400

    #Radius of each circel
    oradius = 20

    
    if len(doc_matrix) > 0:
        screen_matrix = {(20,380):[top_doc]}
        svg = '<svg xmlns="http://www.w3.org/2000/svg" id="svg-obj" viewBox="0 0 400 400">'

        for item in doc_matrix:
            x = item['dis'] #Distance as units of 1
            dis = (sdmin*(1 - ((x - dmin)/(dmax-dmin)))) + (sdmax*((x - dmin)/(dmax-dmin)))
            deg = item['cos'] # in radians
            doc_id = item['doc_id']
            dx = math.cos(deg) * dis # x-intercept
            dy = math.sin(deg) * dis # y-intercept
            
            #Convert x and y to screen cordinates
            xx = int(dx)
            yy = int(b-dy)
            sx = (int(xx/bin_width)) * bin_width + (bin_width/2)
            sy = (int(yy/bin_width)) * bin_width - (bin_width/2)
            
            if (sx,sy) in screen_matrix:
                screen_matrix[(sx,sy)].append(doc_id)
            else:
                screen_matrix[(sx,sy)] = [doc_id]
            
        i = 0
        for key, value in screen_matrix.items():
            svg += '<circle class="cresult cdefault hasmenu" id="g'+str(i+1)+'" data-elems="'+",".join(value)+'" stroke-alignment="inner" cx="'+str(key[0])+'" cy="'+str(key[1])+'" r="'+str(oradius)+'"></circle>'
            svg += '<text class="ctext hasmenu" id="t'+str(i+1)+'" data-elems="'+",".join(value)+'" x="'+str(key[0]-5)+'" y="'+str(key[1]+5)+'">'+str(len(value))+'</text>'
            i += 1
            
        svg += '</svg>'
    else:
        svg = "There was an error in processing the query"
    return svg



def get_final_query(query_type, post_raw):
    """Processes post data sent by javascript, and then generates Elasticsearch query"""
    
    body_str = ((post_raw.body).decode('utf-8')) #Requried for python conversion of JSON to python object
    
    post_data = json.loads(body_str)
    index = post_data.get('index')
    doc_type = post_data.get('doc_type')
    
    if post_data.get('search_type') is not None:
        search_type = int(post_data.get('search_type'))
    else:
        search_type = 1 #Default search - string search
        
    search_string = post_data.get('search_string')
    
    if search_type == 2:
        #Document like is search
        string_query = {"more_like_this" : {"fields" : get_desc_field_list(index,doc_type), "ids": search_string}}
    else:
        #Default string search
        string_query = {"simple_query_string" : {"query": search_string, "fields" : get_desc_field_list(index,doc_type)}}
    
    filtered = 0
    add_data = 0
    default_dict = {}
    facets = post_data.get('facets')
    dragdrop = post_data.get('dragdrop')
    pageno = post_data.get('pageno')
    filter_query = []
    
    if facets and len(facets) > 0:
        filtered = 1
        filter_query += facets

    if dragdrop and len(dragdrop) > 0:
        filtered = 1
        filter_query += dragdrop
        
    if (pageno is None) or (pageno<=0):
        pageno = 1  
    
    if filtered != 0:
            final_query = {
                    "filtered" : {
                        "query" : string_query,
                        "filter" : {
                             "and": filter_query
                             }
                            }
                         }
    else:
        final_query = string_query
            
    if (query_type == 'text_search'):
        #Text Search Resulst
        query = { "from" : (pageno-1)*10, "size" : 10, "query" : final_query}
        add_data = pageno
        default_dict = {1: {'_source' : {'pmid' : '0', 'title' : 'There was error in the system', 'journal_title' : '', 'year': '', 'journal_volume' : '', 'journal_issue' : '', 'jounral_page' : '', 'article_type' : [], 'mesh' : [], 'abstract' : 'Please try again. If error persists, contact the website administrator'}}}
        
    elif (query_type == 'side_facets'):
        #SIde Menu Aggregations
        agg_fields = get_agg_fields(index,doc_type) 
        query = {
                "aggregations" : agg_fields
                }
        
        agg_names = get_agg_dict(index, doc_type)        
        selected_filters = {}
        for key, value in agg_names.items():
            selected_filters[value[3]] = []
        default_dict = {"Error" : {"facets": [{'key_name': 'Error', 'field': '', 'type': 'terms', 'name': 'Code Error', 'count' : 0 , 'selected': 0}]}}
    
        #For selecting checkbox of already selected facets
        if search_string is not None:
            query["query"] = final_query
            for filter_terms in facets:
                fdict = filter_terms.get('terms')
                if not fdict:
                    fdict = filter_terms.get('range')
                    fkey = ''
                    ckey = list(fdict.values())[0]
                    if ckey.get('gte'):
                        fkey += ckey.get('gte') + '-'
                    else:
                        fkey += '*-'
                    if ckey.get('lte'):
                        fkey += ckey.get('lte')
                    else:
                        fkey += '*'    
                else:
                    fkey = list(fdict.values())[0][0]
                ffield = list(fdict.keys())[0]
                selected_filters[ffield].append(fkey)
        add_data = selected_filters
    
    elif (query_type == 'relevant_facets'):
        
        #Generates list of relelvent facets
        significant_aggs = get_sig_agg(index, doc_type)
        query = { 'size' : '100',
         "aggregations" : significant_aggs
                    }
        query["query"] = final_query
    
    
    elif (query_type == 'keyword_cloud'):
        
        #Gerenates Keyword cloud
        significant_keys = get_sig_keys(index, doc_type)
        query = { 'size' : '100',
                 "aggregations" : significant_keys }
        query["query"] = final_query
        
        
    elif (query_type == 'document_matrix'):
        
        #Gerenates document graph - same as text search query. Document graph is dependent on stored term vector information when indexing.
        
        query = {  "size" : 100, "query" : final_query}
    
    
    return [query, add_data, default_dict, index, doc_type]
    
@csrf_exempt     
def send_relevant_facets(request, index):
    """Generate list of relevenat facets and send it to client"""
    
    if (request.method == "POST"):
        process_post = get_final_query('relevant_facets', request)
        query = process_post[0]
        index = process_post[3]
        doc_type = process_post[4]
        es = generate_elastic(index)
        try:         
            res = do_search(es, query, index, doc_type)
        except:
            response_dict = {"Error" : {"facets": [{'name': 'Code Error', 'count' : 0 , 'selected': 0}]}}
        else:
            response_dict={}
            agg_pairs = []
            agg_dict = {}
            agg_names = get_sig_agg_names (index, doc_type)
            agg_fields = get_sig_agg_fields (index, doc_type)
            
            i = 0
            for agg in query['aggregations'].keys():
                bucket = res['aggregations'][agg]['buckets']
                j = 0
                for bitem in bucket:
                    try:
                        b_key = bitem['key_as_string']
                    except:
                        b_key = bitem['key']
                    b_score = bitem['score']
                    b_count = bitem ['doc_count']
                    b_all = bitem['bg_count']
                    docid_list = []
                    doc_ids = get_url_field(index,doc_type)
                    for pitem in bitem['top_articles']['hits']['hits']:
                        aitem = pitem['_source'][doc_ids['main']]
                        if doc_ids.get('sub'):
                            aitem = pitem['_source'][doc_ids['main']][doc_ids['sub']]
                        docid_list.append(aitem)
                    if bitem.get('key_as_string'):
                        bitem_key = bitem['key_as_string']
                    else:
                        bitem_key = bitem['key']
                    agg_dict[i] = {'agg': agg, 'field': agg_fields[agg], 'type': "terms", 'key_name': bitem_key,'bucket': j, 'docids' : docid_list, 'score' : b_score , 'name': b_key, 'doc_count' : b_count, 'bg_count': b_all}
                    agg_pairs.append((b_score,i))
                    i += 1
                    j += 1
            agg_pairs.sort(reverse=True)
            if len(agg_pairs) > 1:
                max_score = agg_pairs[0][0] if agg_pairs[0][0] > 1 else 1
            else:
                max_score =1
            max_list = 20 if len(agg_pairs)>20 else len(agg_pairs)
            final_pairs = agg_pairs[:max_list] 
            c = 0
            for f in final_pairs:
                bid = f[1]
                response_dict[c] = {'field': agg_dict[bid]['field'], 'type': agg_dict[bid]['type'], 'key_name': agg_dict[bid]['key_name'], 'agg_type': agg_names[agg_dict[bid]['agg']],'name': agg_dict[bid]['name'], 'weight': agg_dict[bid]['score']/max_score, 'count': agg_dict[bid]['doc_count'], 'ids' : agg_dict[bid]['docids']}
                c += 1
        return JsonResponse(response_dict,safe=False)

@csrf_exempt    
def send_keywords(request, index):
    """Generate keyword cloud and send it to client"""
    
    if (request.method == "POST"):
        process_post = get_final_query('keyword_cloud', request)
        query = process_post[0]
        index = process_post[3]
        doc_type = process_post[4]
        es = generate_elastic(index)
        doc_ids = get_url_field(index,doc_type)
        try:         
            res = do_search(es, query, index, doc_type)
        except:
            response_dict = [{"text" : "Error" , "size" : 3, "ids" : []}]
        else:
            response_dict=[]
            i = 0
            max_score = 1
            bucket = res['aggregations']['significantKeys']['buckets']
            for bitem in bucket:
                try:
                    b_key = bitem['key_as_string']
                except:
                    b_key = bitem['key']

                b_score = bitem['score']
                if i==0:
                    max_score = b_score if b_score > 1 else 1
                docid_list = []
                for pitem in bitem['top_articles']['hits']['hits']:
                    aitem = pitem['_source'][doc_ids['main']]
                    if doc_ids.get('sub'):
                        aitem = pitem['_source'][doc_ids['main']][doc_ids['sub']]
                    docid_list.append(aitem)
                
                response_dict.append({'field': get_kw_field(index,doc_type), 'type': "terms", 'key_name': b_key, 'text': b_key, 'size': ((b_score/max_score)*(48-12)) + 12, 'ids' : docid_list})
                i += 1
        return JsonResponse(response_dict,safe=False)

#Generate Side menu in-response to query
@csrf_exempt
def generate_facets(request, index):
    """Generate side menu facets"""
    
    if (request.method == "POST"):
        process_post = get_final_query('side_facets', request)
        query = process_post[0]
        selected_filters = process_post[1]
        default_dict = process_post[2]
        index = process_post[3]
        doc_type = process_post[4]
        es = generate_elastic(index)
        
        try:         
            res = es.search(index=index, doc_type=doc_type, body=query, search_type="count")
        except:
            response_dict = default_dict
        else:
            aggregations = res['aggregations']
            agg_dict = get_agg_dict(index,doc_type)
            response_dict = {}
            for ag, ag_name in agg_dict.items():
                ag_buckets = aggregations[ag]['buckets']
                response_dict[ag_name[0]] = {'order': ag_name[1], 'facets' : []}
                for item in ag_buckets:
                    idict = {'key_name': 'Error', 'field': '', 'type': 'terms', 'name': '', 'count' : 0 , 'selected': 0}
                    idict['name'] = item['key']
                    idict['count'] = item['doc_count']
                    idict['selected'] = 0
                    idict['field'] =  ag_name[3]
                    idict['type'] =  ag_name[2]
                    
                    if idict['type'] == "range":
                        current_key = {}
                        it_str = ""
                        if item.get('from_as_string') is not None:
                            it_str += "'gte' : '"+str(item['from_as_string'])+"',"
                        
                        if item.get('to_as_string') is not None:
                            it_str += "'lte' : '"+str(item['to_as_string'])+"'"
                        
                        idict['key_name'] = "{"+it_str+"}"
                        
                    else:    
                        idict['key_name'] = item['key']
                        
                    current_key = item['key']
                    if selected_filters.get(idict['field']):
                        selected_dict = selected_filters.get(idict['field'])
                        if current_key in selected_dict:
                            idict['selected'] = 1
                            
                        
                    if idict['count'] > 0:
                        response_dict[ag_name[0]]['facets'].append(idict)
        if not response_dict:
            response_dict = default_dict
        return JsonResponse(response_dict,safe=False)


@csrf_exempt
def document_graph(request, index):
    """Generate document graph and send it to client"""
    
    if (request.method == "POST"):
        process_post = get_final_query('document_matrix', request)
        query = process_post[0]
        index = process_post[3]
        doc_type = process_post[4]
        es = generate_elastic(index)
        try:         
            res = do_search(es, query, index, doc_type)
        except:
            response_dict = {'top_doc' : '0', 'doc_matrix' : [], 'max_dis' : 0}
        else:
            i = 0
            top_vector = {}
            sim_matrix = []
            response_dict = {'top_doc' : '0', 'doc_matrix' : [], 'max_dis' : 0}
            for hit in res['hits']['hits']:
                doc_id = hit['_id']
                terms = es.termvector(index=index, doc_type=doc_type, id=doc_id)
                
                tv1 = terms.get('term_vectors')
                tv_fields = get_tv_field(index,doc_type)
                tv2 = tv1.get(tv_fields['main'])
                if tv_fields.get('sub'):
                    tv2 = tv2.get(tv_fields['sub'])
                
                terms_vector = dict([ (k, v['term_freq'])  for k,v in tv2.get('terms').items()])
                if i == 0:
                    top_vector = terms_vector
                    response_dict['top_doc'] = doc_id
                else:
                    cal_matrix = {'doc_id': '0', 'cos': 0.0, 'dis' : 0.0}
                    cal_matrix['cos'],cal_matrix['dis'] = get_distance_angle(top_vector, terms_vector)
                    response_dict['max_dis'] = max(cal_matrix['dis'], response_dict['max_dis'])
                    cal_matrix['doc_id'] = doc_id
                    
                    sim_matrix.append(cal_matrix)

                i += 1
            response_dict['doc_matrix'] = sim_matrix
        if not response_dict:
            response_dict = {'top_doc' : '0', 'doc_matrix' : [], 'max_dis' : 0}
            
        graph_data = generate_document_graph(response_dict)
        return HttpResponse(graph_data)

#Perform a string search
@csrf_exempt        
def search_query(request, index):
    
    if (request.method == "POST"):
        process_post = get_final_query('text_search', request)
        query = process_post[0]
        pageno = process_post[1]
        default_dict = process_post[2]
        index = process_post[3]
        doc_type = process_post[4]
        
        try:
            es = generate_elastic(index)
        except:
            response_dict = default_dict
        else:
            res = do_search(es, query, index, doc_type)
            i = 1
            response_dict = {'total_hits': res['hits']['total'], 'pageno': pageno, 'results': {}}
            for hit in res['hits']['hits']:
                response_dict['results'][i]={'_source' : hit['_source']}
                i += 1;
        if not response_dict:
            response_dict = default_dict
        return JsonResponse(response_dict,safe=False) 
        
        
#Return List of documents on right click
@csrf_exempt        
def document_list(request, index):
    if (request.method == "POST"):
        index_list = json.loads(request.POST.get('id-list'))
        index = request.POST.get('index')
        doc_type = request.POST.get('doc_type')
        field_list = get_document_title_field(index,doc_type)
        field_name = field_list['main']
        if field_list.get('sub'):
            field_name += "." + field_list['sub']
        url_list = get_url_field(index,doc_type)
        url_id = url_list['main']
        if url_list.get('sub'):
            url_id += "." + url_list['sub']
        response_dict = {}
        try:
            es = generate_elastic(index)
        except:
            response_dict = {0: {field_name: 'There was an error!!', url_id: ''}}
        else:
            i = 0
            for doc_id in index_list:
                res = es.get_source(index=index, doc_type=doc_type, id=doc_id, _source =[url_id, field_name])
                response_dict[i] = res
                i += 1
        if not response_dict:
            response_dict = {0: {field_name: 'There was an error!!', url_id: ''}}
        return JsonResponse(response_dict,safe=False)
        
        
#Does a Doucment like this search
@csrf_exempt
def documents_like_this(request, index):
    if (request.method == "POST"):
        process_post = get_final_query('documents_like_this', request)
        query = process_post[0]
        pageno = process_post[1]
        default_dict = process_post[2]
        index = process_post[3]
        doc_type = process_post[4]
        try:
            es = generate_elastic(index)
        except:
            response_dict = default_dict 
        else:
            res = do_search(es, query, index, doc_type)
            i = 1
            response_dict = {'total_hits': res['hits']['total'], 'pageno': pageno, 'results': {}}
            for hit in res['hits']['hits']:
                response_dict['results'][i]={'_source' : hit['_source']}
                i += 1;
        if not response_dict:
            response_dict = default_dict
        return JsonResponse(response_dict,safe=False) 