import requests
import re

def check_stream(url, headers):
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200 and response.content:
            return 'working'
        else:
            return 'failed'
    except requests.RequestException as e:
        return f'error: {e}'

def parse_m3u(file_path):
    streams = []
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
        i = 0
        while i < len(lines):
            if lines[i].startswith('#EXTINF'):
                # Extract channel name
                channel_info = lines[i]
                channel_name_match = re.search(r'tvg-name="(.*?)"', channel_info)
                if channel_name_match:
                    channel_name = channel_name_match.group(1)
                else:
                    channel_name = channel_info.split(',', 1)[-1].strip()
                
                # Initialize headers
                headers = {}

                # Check for optional headers in the next few lines
                i += 1
                while lines[i].startswith('#EXTVLCOPT'):
                    if 'http-referrer' in lines[i]:
                        referrer_match = re.search(r'http-referrer=(.*)', lines[i])
                        if referrer_match:
                            headers['Referer'] = referrer_match.group(1).strip()
                    if 'user-agent' in lines[i]:
                        user_agent_match = re.search(r'user-agent=(.*)', lines[i])
                        if user_agent_match:
                            headers['User-Agent'] = user_agent_match.group(1).strip()
                    i += 1

                # Next line should be the URL
                url = lines[i].strip()
                streams.append((channel_name, url, headers))
            i += 1
    return streams

def test_streams(m3u_file, output_file):
    streams = parse_m3u(m3u_file)
    with open(output_file, 'w', encoding='utf-8') as result_file:
        for channel_name, url, headers in streams:
            status = check_stream(url, headers)
            result_file.write(f"{channel_name}: {status}\n")
            print(f"{channel_name}: {status}")

if __name__ == "__main__":
    m3u_file = "file.m3u"  # replace with the path to your M3U file
    output_file = "stream_status.txt"    # replace with the desired output file name
    test_streams(m3u_file, output_file)
    print(f"Stream status written to {output_file}")
