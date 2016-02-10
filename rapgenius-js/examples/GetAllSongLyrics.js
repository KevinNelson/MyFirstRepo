var superAgent = require("superagent"),
	cheerio = require("cheerio"),
	rapgeniusClient = require("../src/geniusClient.js"),
	RapLyricsParser = require("../src/parsers/LyricsParser"),
	Artist = require("../src/model/Artist"),
	Song = require("../src/model/Song"),
	StringUtils = require("../src/util/StringUtils"),
	Constants = require("../src/constants/Constants"),
	http = require("http"),
	concat = require('concat-stream');
require('longjohn');

searchArtist("Kendrick Lamar", "rap", function(err, artist) {
	if(err)
	{
		console.log("Error: " + err);
	}
	else
	{
		//For each of the songs...
		Object.keys(artist.songs).forEach(function(key) {
			console.log(artist.songs[key].name + "  " + artist.songs[key].link);	
			//searchLyricsAndExplanations(artist.songs[key].link, "rap", lyricsSearchCb);
		
			var type = "rap"
			var type2Urls = Constants.Type2URLs[type];
			var link = artist.songs[key].link;
			var url = /^http/.test(link) ? link : type2Urls.base_url + link;
			
			console.log(link);
			
			process.on('uncaughtException', function (err) {
				//console.error(err.stack);
				console.log("Node NOT Exiting...");
				wait(5000);
			});
			http.get({
				host: 'genius.com',
				path: link
			}, function(response) {
				//wait(2000);
				response.pipe(concat(function(res) {
					//if(res.ok)
					{
						var result = RapLyricsParser.parseLyricsHTML(res, type);
						if(result instanceof  Error)
						{
							console.log("THERE WAS AN ERROR PARSING THE LYRICS");
						}		
						else
						{
							console.log(result.getFullLyrics(false));
							//callback(null, result);
						}
					}
					//else
					{
					//	console.log("An error occurred while trying to access lyrics[url=%s, status=%s]", url, res.status);
						//return callback(new Error("Unable to access the page for lyrics [url=" + link + "]"));
					}
				}))
			});
			
			
			/*superAgent.get(url)
			.set("Accept", "text/html")
			.end(function(res){
				console.log("I'm inside the end function thing");
				if(res.ok)
				{
					var result = RapLyricsParser.parseLyricsHTML(res.text, type);
					if(result instanceof  Error)
					{
						console.log("THERE WAS AN ERROR PARSING THE LYRICS");
					}		
					else
					{
						console.log(result.getFullLyrics(false));
						//callback(null, result);
					}
				}
				else
				{
					console.log("An error occurred while trying to access lyrics[url=%s, status=%s]", url, res.status);
					//return callback(new Error("Unable to access the page for lyrics [url=" + link + "]"));
				}
			});*/
			//wait(2000);
		});
	}
});


function wait(ms)
{
	var d = new Date();
	var d2 = null;

	do { d2 = new Date(); } 
	while(d2-d < ms);
}


var lyricsSearchCb = function(err, lyricsAndExplanations)
{
	console.log("Made it to the lyrics callback");
	if(err)
	{
		console.log("Error: " + err);
	}
	else
	{
		//Printing lyrics without section names
		var lyrics = lyricsAndExplanations.lyrics;
		//console.log("Found lyrics for song [title=%s, main-artist=%s, featuring-artists=%s, producing-artists=%s]",
		//	lyrics.songTitle, lyrics.mainArtist, lyrics.featuringArtists, lyrics.producingArtists);
		
		console.log("**************************");
		//console.log(lyrics.getFullLyrics(false));
		console.log("**************************");
		//console.log(lyrics.songTitle);
	}
};


function searchLyricsAndExplanations(link, type, callback)
{
	var lyrics = null;
	var lyricsCallback = function(err, rapLyrics)
	{
		if(err)
		{
			callback(err);
		}
		else
		{
			lyrics = rapLyrics;
	  
			console.log(lyrics.getFullLyrics(false));
			callback(null, {lyrics: lyrics});
		}
	};

	searchSongLyrics(link, type, lyricsCallback);
}


function searchSongLyrics(link, type, callback)
{
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
		if(res.ok)
		{
			var result = RapLyricsParser.parseLyricsHTML(res.text, type);
			if(result instanceof  Error)
			{
				callback(result);
			}		
			else
			{
				console.log(result.getFullLyrics(false));
				//callback(null, result);
			}
		}
		else
		{
			console.log("An error occurred while trying to access lyrics[url=%s, status=%s]", url, res.status);
			return callback(new Error("Unable to access the page for lyrics [url=" + link + "]"));
		}
	});
}


//Find the artist's page, get the title/link of all their songs, then call the callback
function searchArtist(artist, type, callback) 
{
	type = type.toLowerCase();
	var type2Urls = Constants.Type2URLs[type];
	if (!type2Urls){
		process.nextTick(function(){
			callback("Unrecognized type in artist search [type=" + type + "]");
		});
		return;
	}

	superAgent.get(type2Urls.artist_url + artist)
	.set("Accept", "text/html")
	.end(function (res) {
		debugger;
		if (res.ok) 
		{
			parseArtistHTML(res.text, type, function(result){
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

//Get the song title/link for each song from the artist page and call the callback
function parseArtistHTML(html, type, callback) 
{
	var urls = Constants.Type2URLs[type];
	var $ = cheerio.load(html);
	
	var artistElem = $(".canonical_name", "#main");
	var artistName = "";

	if (artistElem.length <= 0) 
	{
		return new Error("Could not find artist");
	}

	artistElem = artistElem[0];

	artistElem.children.forEach(function (childElem) {
		if (childElem.type === "text") 
		{
			artistName += StringUtils.removeWhiteSpacesAndNewLines(childElem.data);
		}
	});

	var artistLink = urls.artist_url + artistName.replace(" ", "-");
	var rapArtist = new Artist(artistName, artistLink);

	parseArtistForReal(html, type, rapArtist, function(result){
		callback(result);
	});
}

//Function created to handle artists that have multiple pages of songs.
//Recursively looks at each page and adds the song titles / links to the rap artist
function parseArtistForReal(html, type, rapArtist, callback)
{
	try 
	{
		var urls = Constants.Type2URLs[type];
		var $ = cheerio.load(html);

		var artistLink = rapArtist.link;

		var songs = $(".song_list", "#main");
		songs.each(function (index, song) {
			var songLinkElem = $(song).find(".song_link");
			songLinkElem.each(function (i, s) {
				var songLink = $(s).attr("href");
				var songName = StringUtils.removeWhiteSpacesAndNewLines($(s).children(".title_with_artists").text());
				var rapSong = new Song(songName, artistLink, songLink);

				rapArtist.addSong(rapSong);
			});
		});
		
		var things = $(".pagination", "#main");
		things.each(function (index, thing) {
			var nextPage = $(thing).find(".next_page");
			nextPage.each(function (i, s) {
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
					}
				});
			});
		});
	} 
	catch (e) 
	{
		console.log("An error occured while trying to parse the artist: [html=" + html + "], error: " + e);
		return new Error("Unable to parse artist details results from RapGenius");
	}
}