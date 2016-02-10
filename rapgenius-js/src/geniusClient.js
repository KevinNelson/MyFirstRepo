var superAgent = require("superagent"),
  RapSongParser = require("./parsers/SongsParser"),
  RapArtistParser = require("./parsers/ArtistParser"),
  RapLyricsParser = require("./parsers/LyricsParser")
  Constants = require("./constants/Constants");

var RAP_GENIUS_URL = "http://genius.com";
var RAP_GENIUS_ARTIST_URL = "http://genius.com/artists/";
var RAP_GENIUS_SONG_EXPLANATION_URL = RAP_GENIUS_URL + "/annotations/for_song_page";


function searchSong(query, type, callback) {
  //TODO perform input validation

  type = type.toLowerCase();
  var type2Urls = Constants.Type2URLs[ type];
  if (!type2Urls){
      process.nextTick(function(){
         callback("Unrecognized type in song search [type=" + type + "]");
      });
      return;
  }

  superAgent.get(type2Urls.search_url)
    .query({q: query})
    .set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
    .end(function (res) {
      if (res.ok) {
        var result = RapSongParser.parseSongHTML(res.text, type);
        if (result instanceof Error) {
          return callback(result);
        } else {
          return callback(null, result)
        }
      } else {
        console.log("Received a non expected HTTP status [status=" + res.status + "]");
        return callback(new Error("Unexpected HTTP status: " + res.status));
      }
    });
}

function searchArtist(artist, type, callback) {
  //TODO perform input validation
    type = type.toLowerCase();
    var type2Urls = Constants.Type2URLs[ type];
    if (!type2Urls){
        process.nextTick(function(){
            callback("Unrecognized type in artist search [type=" + type + "]");
        });
        return;
    }

    superAgent.get(type2Urls.artist_url + artist)
    //superAgent.get("http://genius.com/artists/songs?for_artist_page=45&id=Eminem&page=1&pagination=false")
	.set("Accept", "text/html")
    .end(function (res) {
        debugger;
        if (res.ok) 
		{
			RapArtistParser.parseArtistHTML2(res.text, type, function(result){
				if (result instanceof Error) 
				{
					callback(result);
				} 
				else 
				{
					callback(null, result);
				}
				console.log("searchArtist called its callback");
			});
		} 
		else 
		{
			console.log("Received a non expected HTTP status [status=" + res.status + "]");
			return callback(new Error("Unexpected HTTP status: " + res.status));
		}
    });
}


function searchSongLyrics(link, type, callback){
  //Check whether the URL is fully defined or relative
  type = type.toLowerCase();
  var type2Urls = Constants.Type2URLs[ type];
  if (!type2Urls){
    process.nextTick(function(){
      callback("Unrecognized type in song lyrics search [type=" + type + "]");
    });
    return;
  }

  var url = /^http/.test(link) ? link : type2Urls.base_url + link;
  superAgent.get(url)
    .set("Accept", "text/html")
    .end(function(res){
      if(res.ok){
        var result = RapLyricsParser.parseLyricsHTML(res.text, type);
        if(result instanceof  Error){
          return callback(result);
        }else{
          return callback(null, result);
        }
      }else{
        console.log("An error occurred while trying to access lyrics[url=%s, status=%s]", url, res.status);
        return callback(new Error("Unable to access the page for lyrics [url=" + link + "]"));
      }
    });
}

function searchLyricsExplanation(songId, type, callback){
  //Check whether the URL is fully defined or relative
  console.log("IM IN SEARCH LYRICS EXPLANATION");
  type = type.toLowerCase();
  var type2Urls = Constants.Type2URLs[type];
  if (!type2Urls){
	console.log("I FOUND AN ERROR");
    process.nextTick(function(){
	  callback("Unrecognized type in song lyrics search [type=" + type + "]");
    });
    return;
  }

  console.log("IM HERE AND I HATE YOU " + type2Urls.annotations_url);
  superAgent.get(type2Urls.annotations_url)
    .set("Accept", "text/html")
    .query({song_id: songId})
    .end(function(res){
		console.log("IM SEARCHING!!");
	  if(res.ok){
        var explanations = RapLyricsParser.parseLyricsExplanationJSON(JSON.parse(res.text));
		console.log("Search lyrics explanations about to call the callback");
        if(explanations instanceof Error){
          return callback(explanations);
        }else{
          return callback(null, explanations);
        }
      }else{
        console.log("An error occurred while trying to get lyrics explanation[song-id=%s, status=%s]", songId, res.status);
        return callback(new Error("Unable to access the page for lyrics [url=" + songId + "]"));
      }
    });
}

function searchLyricsAndExplanations(link, type, callback){
  var lyrics = null;
  var lyricsCallback = function(err, rapLyrics){
	if(err){
      return callback(err);
    }else{
      lyrics = rapLyrics;
	  
	  console.log(lyrics.getFullLyrics(false));
	  return callback(null, {lyrics: lyrics});
      //searchLyricsExplanation(lyrics.songId, type, explanationsCallback);
    }
  };

  var explanationsCallback = function(err, explanations){
	console.log("Made it to the explanations callback");
	if(err){
      return callback(err);
    }else{
      return callback(null, {lyrics: lyrics, explanations: explanations});
    }
  };

  searchSongLyrics(link, type, lyricsCallback);
}

module.exports.searchSong = searchSong;
module.exports.searchArtist = searchArtist;
module.exports.searchSongLyrics = searchSongLyrics;
module.exports.searchLyricsExplanation = searchLyricsExplanation;
module.exports.searchLyricsAndExplanations = searchLyricsAndExplanations;
