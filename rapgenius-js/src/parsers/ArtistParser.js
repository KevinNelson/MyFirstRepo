var cheerio = require("cheerio"),
  CONSTANTS = require("../constants/Constants"),
  Song = require("../model/Song"),
  Artist = require("../model/Artist"),
  StringUtils = require("../util/StringUtils"),
  superAgent = require("superagent");


function parseArtistHTML(html, type) {
  try {
    var urls = CONSTANTS.Type2URLs[type];
    var $ = cheerio.load(html);
	
	//console.log(html);
	
    var artistElem = $(".canonical_name", "#main");
    var artistName = "";

    if (artistElem.length <= 0) {
      return new Error("Could not find artist");
    }

    //TODO either find a library that enables me to extract text from text nodes of direct
    // children or improve cheerio API
    artistElem = artistElem[0];

    artistElem.children.forEach(function (childElem) {
      if (childElem.type === "text") {
        artistName += StringUtils.removeWhiteSpacesAndNewLines(childElem.data);
      }
    });

    var artistLink = urls.artist_url + artistName.replace(" ", "-");
    var rapArtist = new Artist(artistName, artistLink);

    var songs = $(".song_list", "#main");
    songs.each(function (index, song) {
      var songLinkElem = $(song).find(".song_link");
      songLinkElem.each(function (i, s) {
        var songLink = $(s).attr("href");
        var songName = StringUtils.removeWhiteSpacesAndNewLines($(s).children(".title_with_artists").text());
        var rapSong = new Song(songName, artistLink, songLink);

        if (index === 0) {
          //This element represents the favourite songs of the artist
          rapArtist.addPopularSong(rapSong);
        }
        rapArtist.addSong(rapSong);
      });

    });

    return rapArtist;

  } catch (e) {
    console.log("An error occured while trying to parse the artist: [html=" + html + "], error: " + e);
    return new Error("Unable to parse artist details results from RapGenius");
  }
}

function parseArtistHTML2(html, type, callback) 
{
	var urls = CONSTANTS.Type2URLs[type];
	var $ = cheerio.load(html);
	
	var artistElem = $(".canonical_name", "#main");
	var artistName = "";

	if (artistElem.length <= 0) 
	{
		return new Error("Could not find artist");
	}

	//TODO either find a library that enables me to extract text from text nodes of direct
	// children or improve cheerio API
	artistElem = artistElem[0];

	artistElem.children.forEach(function (childElem) {
		if (childElem.type === "text") 
		{
			artistName += StringUtils.removeWhiteSpacesAndNewLines(childElem.data);
		}
	});

	var artistLink = urls.artist_url + artistName.replace(" ", "-");
	var rapArtist = new Artist(artistName, artistLink);
	//var artistLink = "www.genius.com/artist/eminem";//urls.artist_url + artistName.replace(" ", "-");
	//var rapArtist = new Artist("Eminem", artistLink);
	parseArtistForReal(html, type, rapArtist, function(result){
		callback(result);
	});
}

function parseArtistForReal(html, type, rapArtist, callback)
{
	try 
	{
		var urls = CONSTANTS.Type2URLs[type];
		var $ = cheerio.load(html);

		var artistLink = rapArtist.link;
		//var artistLink = "www.genius.com/artist/eminem";//urls.artist_url + artistName.replace(" ", "-");
		//var rapArtist = new Artist("Eminem", artistLink);

		var songs = $(".song_list", "#main");
		songs.each(function (index, song) {
			var songLinkElem = $(song).find(".song_link");
			songLinkElem.each(function (i, s) {
				var songLink = $(s).attr("href");
				var songName = StringUtils.removeWhiteSpacesAndNewLines($(s).children(".title_with_artists").text());
				var rapSong = new Song(songName, artistLink, songLink);

				//console.log(songName);
				rapArtist.addSong(rapSong);
				/*if (index === 0) 
				{
					//This element represents the favourite songs of the artist
					rapArtist.addPopularSong(rapSong);
				}
				//else
				{
					//console.log(songName);
					rapArtist.addSong(rapSong);
				}*/
			});
		});
		
		var things = $(".pagination", "#main");
		//console.log(things);
		things.each(function (index, thing) {
			var lalala = $(thing).find(".next_page");
			lalala.each(function (i, s) {
				var linkylink = $(s).attr("href");
				if(linkylink === undefined)
				{
					callback(rapArtist);
					console.log("We've called the callback... ending");
					return;
				}
				console.log("http://genius.com" + linkylink);
				superAgent.get("http://genius.com"+linkylink)
				.set("Accept", "text/html")
				.end(function (res) {
					debugger;
					if (res.ok) 
					{
						parseArtistForReal(res.text, "rap", rapArtist, callback);
					} 
					else 
					{
						console.log("Received a non expected HTTP status [status=" + res.status + "]");
						//return callback(new Error("Unexpected HTTP status: " + res.status));
					}
				});
			});
		});

		//return rapArtist;

	} 
	catch (e) 
	{
		console.log("An error occured while trying to parse the artist: [html=" + html + "], error: " + e);
		return new Error("Unable to parse artist details results from RapGenius");
	}
}

module.exports.parseArtistHTML = parseArtistHTML;
module.exports.parseArtistHTML2 = parseArtistHTML2;