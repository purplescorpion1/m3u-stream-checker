# m3u Stream Checker
A Script To Check If The Streams In An m3u File Are Working

### Requirements
Node.js <br>
VLC <br>
m3u file to check <br>

### Setup
Make sure VLC folder location is set to path/environmental variables <br>
Check VLC is able to run in cmd/terminal by doing ```vlc --version``` <br>
If it displays the version number than you are good to go <br>
Open m3ucheck.py with notepad++ or any code text editor <br>
Change files.m3u at the top of the file to the name of your m3u file <br>
Note if the script is not in the same location as the m3u file put the full path to the file <br>

### How to run
``` node m3ucheck.js ``` <br>
Result of Working or Failed streams will output in the console and will also be saved to stream_results.txt
