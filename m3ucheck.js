const { spawn } = require('child_process');
const fs = require('fs');
const { setTimeout } = require('timers/promises');

const m3uFilePath = 'file.m3u'; // Replace with your M3U file path
const vlcTimeout = 10000; // 10 seconds timeout for VLC to start playing the stream
const resultFilePath = 'stream_results.txt';

function parseM3U(m3uContent) {
    let lines = m3uContent.split('\n');
    let streams = [];
    let currentStream = {};

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            let info = line.substring(8).trim();
            currentStream.name = info.split(',')[1] || ''; // Get channel name from #EXTINF
        } else if (line.startsWith('#EXTVLCOPT:http-referrer=')) {
            currentStream.referrer = line.substring(24).trim();
        } else if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
            currentStream.userAgent = line.substring(25).trim();
        } else if (line.startsWith('http')) {
            currentStream.url = line.trim();
            streams.push(currentStream);
            currentStream = {};
        }
    });

    return streams;
}

async function checkStream(stream) {
    let vlcCommand = `vlc --intf dummy --no-video --play-and-exit "${stream.url}"`;

    let vlcProcess = spawn(vlcCommand, [], { shell: true });

    let timeoutPromise = setTimeout(vlcTimeout);

    let hasError = false;

    vlcProcess.stdout.on('data', (data) => {
        let output = data.toString();
        if (output.includes('main input error')) {
            hasError = true;
        }
    });

    vlcProcess.stderr.on('data', (data) => {
        let output = data.toString();
        if (output.includes('cannot open') || output.includes('main input error')) {
            hasError = true;
        }
    });

    try {
        await Promise.race([timeoutPromise]);

        if (!hasError) {
            console.log(`${stream.name} - working`);
            appendResult(`${stream.name} - working`);
        } else {
            console.log(`${stream.name} - failed to start playback`);
            appendResult(`${stream.name} - failed to start playback`);
        }
    } catch (err) {
        console.error(`${stream.name} - failed (error: ${err.message})`);
        appendResult(`${stream.name} - failed (error: ${err.message})`);
    } finally {
        vlcProcess.kill();
    }
}

function appendResult(result) {
    fs.appendFileSync(resultFilePath, result + '\n', (err) => {
        if (err) {
            console.error('Error appending to stream_results.txt:', err);
        }
    });
}

// Check if the result file exists and delete it if it does
fs.access(resultFilePath, fs.constants.F_OK, (err) => {
    if (!err) {
        // File exists, so delete it
        fs.unlink(resultFilePath, (err) => {
            if (err) {
                console.error('Error deleting existing stream_results.txt:', err);
            }
        });
    }
});

fs.readFile(m3uFilePath, 'utf8', async (err, data) => {
    if (err) {
        console.error(`Error reading file: ${err}`);
        return;
    }

    const streams = parseM3U(data);

    for (let stream of streams) {
        if (!stream.name) {
            stream.name = stream.url.split('/').pop().split('.')[0]; // Use filename as fallback name
        }
        await checkStream(stream);
    }

    console.log('All streams checked.');

    // Close VLC or perform cleanup here if needed
    process.exit(0); // Ensure script terminates after all streams are checked
});
