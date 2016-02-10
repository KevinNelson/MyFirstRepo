var rapgeniusClient = require("../src/geniusClient.js");
require('longjohn');

rapgeniusClient.searchArtist("Eminem", "rap", function(err, artist) {
	if(err)
	{
		console.log("Error: " + err);
	}
	else
	{
		//console.log("Rap artist found [name=%s, link=%s, songs=%d]",
		//	artist.name, artist.link, artist.songs.length);

		//For each of the songs...
		Object.keys(artist.songs).forEach(function(key) {
			console.log(artist.songs[key].name + "  " + artist.songs[key].link);	
			rapgeniusClient.searchLyricsAndExplanations(artist.songs[key].link, "rap", lyricsSearchCb);
		});
	}
});


var lyricsSearchCb = function(err, lyricsAndExplanations){
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

var searchCallback = function(err, songs)
{
	if(err)
	{
		console.log("Error: " + err);
	}
	else
	{
		if(songs.length > 0){
			//We have some songs
			rapgeniusClient.searchLyricsAndExplanations(songs[0].link, "rap", lyricsSearchCb);
		}
	}
};

//Example for a rock artist
//rapgeniusClient.searchArtist("Bruce Springsteen", "rock", function(err, artist){
//  if(err){
//    console.log("Error: " + err);
//  }else{
//    console.log("Rock artist found [name=%s, link=%s, popular-songs=%d]",
//      artist.name, artist.link, artist.songs.length);
	  
//  }
//});