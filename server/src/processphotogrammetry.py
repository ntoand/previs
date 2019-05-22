import os
import sys
import argparse
import zipfile
import os.path
import json
import shutil

# Author: not NH because I don't know any python. @AH
def validFilename(filename):
    """
    Check if finename is valid
    :param filename: 
    :return: 
    """
    if "__MACOSX" in filename or ".DS_Store" in filename:
        return False
    return True


def splitFilename(filename, hascontainer = False):
    if "/" in filename:
        parts = filename.split("/")
    else:
        parts = filename.split("\\")
    if(parts[len(parts)-1] == ""):
        parts = parts[:-1]
    if(hascontainer):
        parts = parts[1:]
    return parts
   
def main():
    print("I am main")
    
# MAIN FUNCTION
if __name__ == "__main__":
    main()
    #sample call cd /mnt/data/git/previs/server && cd ./src && python processphotogrammetry.py -i /mnt/data/git/previs/server/public/data/tags/f24cf6/photogrammetry.zip -o /mnt/data/git/previs/server/public/data/tags/f24cf6/photogrammetry_result

