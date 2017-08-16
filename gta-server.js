/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var http = require('http');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');

var app = express();
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Setze ejs als View Engine
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'.
 */

app.use(express.static("public/"));

/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

function GeoTagObject(tagging_latitude, tagging_longitude, name, hashtag) {
    this.latitude = tagging_latitude;
    this.longitude = tagging_longitude;
    this.name = name;
    this.hashtag = hashtag;
}



/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */

var GeoTagModule = (function () {
    /**
     * Private Members
     */
    var geoTagObjects = [];

    /**
     * Public Members
     */
    return {
        addGeoTagObject : function (geoTagObject) {
            geoTagObjects.unshift(geoTagObject);
        },

        removeGeoTagObject : function (geoTagObject) {
            var index = geoTagObjects.indexOf(geoTagObject);
            if( index > -1 ) {
                geoTagObjects.splice(index, 1);
            }
        },

        searchGeoTagObject : function (searchTerm) {
            var geoTagsWithSearchTerm = [];

            for(var i = 0; i < geoTagObjects.length; i++) {
                for( key in geoTagObjects[i] ) {
                    if(geoTagObjects[i][key].indexOf(searchTerm) > -1) {
                        geoTagsWithSearchTerm.unshift(geoTagObjects[i]);
                    }
                }
            }

            return geoTagsWithSearchTerm;
        },

        searchRadius : function (lat, lon, radius) {
            var geoTagsInRadius = [];
            var R = 6371e3; // metres

            for (var i = 0; i < geoTagObjects.length; i++) {
                var x = (lon - geoTagObjects[i].getLongitude()) * Math.cos( (lat + geoTagObjects[i].getLatitude()) / 2 );
                var y = (lat - geoTagObjects[i].getLatitude());
                var d = Math.sqrt(x*x + y*y) * R;

                if( d <= radius ){
                    geoTagsInRadius.push(geoTagObjects[i]);
                }
            }

            return geoTagsInRadius;
        },

        getGeoTagObject : function () {
            return geoTagObjects;
        }
    };
})();

/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

var geoTagModule = GeoTagModule;

app.get("/", function(req, res) {
    res.render("gta.ejs", {taglist : geoTagModule.getGeoTagObject()});
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */

app.post('/tagging', function (req, res) {
    GeoTagModule.addGeoTagObject(new GeoTagObject(req.body.tagging_latitude,
                                                  req.body.tagging_longitude,
                                                  req.body.name,
                                                  req.body.hashtag));
    res.render("gta.ejs", {taglist : geoTagModule.getGeoTagObject()});
});


/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */

app.post("/discovery", function(req, res) {
    res.render("gta.ejs", {taglist : GeoTagModule.searchGeoTagObject(req.body.searchterm)});
});

/**
 * Setze Port und speichere in Express.
 */

var port = 3000;
app.set('port', port);

/**
 * Erstelle HTTP Server
 */

var server = http.createServer(app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(port);
