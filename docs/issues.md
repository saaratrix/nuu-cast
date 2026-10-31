# Nuucast

## Bugs
* Going into an empty directory takes you back to root.
* Items flicker before they are filtered.
* Directory cache invalidation

## Features
* API to get all files in a directory.
* Oooh, shiny, a hieracrhy viewer.
* UI scaling.
* Can't delete.
* Can't rename.
* Can't move files.
* Change subtitle size
* Change subtitle offset
* File disk usage information.
* Add date to files
* Always keep at least 1 audio codec.
* Cache mime type, file size in PathCache.
* Add support for play & pause button
    - Well this one seems impossible as the remote does not even send play/pause events.
* Add debug mode in top right corner on main page to enable logging button presses etc.


# Nuuwatch

## Bugs
* Search duplicated the search window.

## Features
* Improve airing to find out if something has aired etc.
* Add error logging to be able to reproduce issues.
* Add group by quality.
* Add group by episode.
* Turn each episode option in a card for easy click on TV, smallest first.
* On click suggest season & episode.
* Pressing enter should add search term
* Add sources
    - .env file or so.
* Season picker - fix metaballs animations
* Anime card:
    * Have rating etc be clickable again, favourite card!
* Find cards from previous season, only works if you saw last season tho.
        * Continuing API?
* Improve items handling now that there are multiple seasons and seasons loading without page refresh.
    
* Api improvements: 
    * Add name to /anime/fetch route so it looks nicer.
    * Dynamically calculate episodes based on the airing data
        * Since the result from API is cached we need to dynamically calculate it.
    * Once a week allow fetching new rating, if it's for the current season.
        * Maybe episodes available?
    * RSS Feed visit once a day?
    
# Nuufetch

## Bugs

## Features
