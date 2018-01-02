import requests
import sys

def downloadFileFromGoogleDrive(id, destination):
    def get_confirm_token(response):
        for key, value in response.cookies.items():
            if key.startswith('download_warning'):
                return value

        return None

    def save_response_content(response, destination):
        CHUNK_SIZE = 32768

        with open(destination, "wb") as f:
            for chunk in response.iter_content(CHUNK_SIZE):
                if chunk: # filter out keep-alive new chunks
                    f.write(chunk)

    URL = "https://drive.google.com/uc?export=download"

    session = requests.Session()

    response = session.get(URL, params = { 'id' : id }, stream = True)
    token = get_confirm_token(response)

    if token:
        params = { 'id' : id, 'confirm' : token }
        response = session.get(URL, params = params, stream = True)
    #else:
    #    raise NameError("cannot_get_token")

    save_response_content(response, destination)    


def downloadLink(service, fileid, destfile):
    if service == "google":
        downloadFileFromGoogleDrive(fileid, destfile)
    else:
        raise NameError("invalid_service")

if __name__ == "__main__":
    
    if len(sys.argv) is not 4:
        print "Usage: python downloadlink.py service id destination_file_path"
        raise NameError("invalid_input_args")
    else:
        service = sys.argv[1]
        fileid = sys.argv[2]
        destination = sys.argv[3]
        downloadLink(service, fileid, destination)