# YouTube ALL HTML5 #

With this addon you can play almost any video on YouTube as a HTML5 video.
This includes videos with monetarisation enabled which normally don't play
in the html5 player, but excludes livestreams which are currently not implemented
by YouTube.

## Usage ##

Just install the addon and disable Flash to watch all videos on YouTube using HTML5.
If you want to disable Flash only on YouTube, there is an option in the settings of
this addon that lets you do so.

The addon also inserts a button right besides the search box that you can use if the
automatic playback fails.

The button also includes a menu you can use to change the size of the video.
Or use the available option in the settings to change the size automatically.

Note that many videos on YouTube are only available as H264 and thus will only
play with newer versions of Firefox.
Under windows set `media.windows-media-foundation.enabled` to true and under linux
set `gstreamer.enabled` to true to enable H264 support.

## Attribution ##

Thanks to [Raylan Givens][rg] for the hint at emulating IE,
[Alexander Schlarb][as] for his patch which makes the addon work with
firefox's click_to_play, [Alex Szczuczko][aszc] for implementing the "pause on
start" function and [timendum][timendum] for his work on embedded videos.

Also thanks to [Jeppe Rune Mortensen][YePpHa] for his work on [YouTubeCenter][ytc].

## Licence ##

This addon by Klemens Schölhorn is licenced under GPLv3.<br />
The modified [HTML5 Logo][w3c] by W3C is licenced under CC-BY 3.0.

[w3c]: http://www.w3.org/html/logo/
[rg]: https://addons.mozilla.org/de/firefox/user/Cullen-Bohannon/
[as]: https://github.com/alexander255
[aszc]: https://github.com/ASzc
[timendum]: https://github.com/timendum
[YePpHa]: https://github.com/YePpHa
[ytc]: https://github.com/YePpHa/YouTubeCenter
