function Artist(name, link) {
  this.name = name;
  this.link = link;
  this.popularSongs = [];
  this.songs = [];
}

Artist.prototype = {
  name: "",
  link: "",
  popularSongs: null,
  songs: null
};

Artist.prototype.addPopularSong = function (rapSong) {
  this.popularSongs.push(rapSong);
};

Artist.prototype.addSong = function (rapSong) 
{
	//Check to make sure not adding duplicate
	var found = false;
	for(var i = 0; i < this.songs.length; i++)
	{
		if (this.songs[i].name.valueOf() === rapSong.name.valueOf())
		{		
			found = true;
		}
	}
	if(!found)
	{
		this.songs.push(rapSong);
	}
};


module.exports = Artist;