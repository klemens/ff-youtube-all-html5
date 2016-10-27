# YouTube ALL HTML5

Play all videos on YouTube with your preferred settings (size, quality,
playback rate, …) without cookies using only HTML5.

* Automatically change the size of the player and the resolution of the video
* Force HTML5 in cases when YouTube still defaults to Flash
* Start videos paused (always, when not in a playlist, when in a background tab)
* Open video links without the attached playlist (context menu entry)
* Features for users that don't keep cookies:
  * Automatically set volume and playback rate
  * Disable autoplay of recommended videos
  * Hide video annotations

All features of the add-on can be individually configured in the settings
(`about:addons`). These are also directly accessible through a button on every
YouTube video page.

## Build

The add-on can be built using `jpm`:

```sh
jpm xpi
```

This creates an unsigned add-on. To build a signed version, you have to change
the add-on id and submit the add-on to [Mozilla Add-ons][amo] for signing.

## Develop

You can run the add-on directly in Firefox with a fresh profile and get log
messages on your terminal:

```sh
jpm -b firefox-dev run
```

Currently `firefox-dev` has to be an aurora (dev) or nightly build of Firefox,
because of a [bug in `jpm`][jpm-468].

## Use

You need a current version of Firefox with support for MSE and VP9 or H264. You
may have to install `ffmpeg` on Linux. Without MSE, only 360p and 720p videos
are available.

YouTube provides a [test site] that checks support for the various pieces
necessary. If some element is missing, check the following Firefox settings:

* `media.mediasource.enabled`
* `media.mediasource.webm.enabled`
* `media.mediasource.mp4.enabled`

## Attribution

Thanks to [Raylan Givens][rg] for the hint at emulating IE,
[Alexander Schlarb][as] for his patch which makes the add-on work with
Firefox's click_to_play, [Alex Szczuczko][aszc] for implementing the "pause on
start" function and [timendum][timendum] for his work on embedded videos.

Also thanks to [Jeppe Rune Mortensen][YePpHa] and [Yonezpt] for their work on
[YouTubeCenter][ytc].

## Licence

This add-on by Klemens Schölhorn is licenced under GPLv3.<br />
The modified [HTML5 Logo][w3c] by W3C is licenced under CC-BY 3.0.

[w3c]: http://www.w3.org/html/logo/
[rg]: https://addons.mozilla.org/de/firefox/user/Cullen-Bohannon/
[as]: https://github.com/alexander255
[aszc]: https://github.com/ASzc
[timendum]: https://github.com/timendum
[YePpHa]: https://github.com/YePpHa
[Yonezpt]: https://github.com/Yonezpt
[ytc]: https://github.com/YePpHa/YouTubeCenter
[jpm-468]: https://github.com/mozilla-jetpack/jpm/issues/468
[amo]: https://addons.mozilla.org/
[test site]: https://www.youtube.com/html5
