from __future__ import print_function
from flask import Flask, render_template, request, jsonify, Response
from werkzeug.utils import secure_filename
from flask_cors import cross_origin
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
from base64 import b64encode, b64decode
from datetime import datetime
from PIL import Image
from io import BytesIO
from flask_cors import CORS
import pymysql
import io
import base64
import sys
import requests
import zipfile
import hashlib
import jwt
import os
import json
import pyotp
import threading
import qrcode
import secrets
import time
import schedule
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from pprint import pprint
import requests
from datetime import datetime, timedelta

jwt_token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJlbmNyeXB0ZWRVc2VyRGF0YSI6IkE2QitvQWRseHlQRWVwYkVWcTZ0RmhhQmNSSWdjK0tjTld0bE50YWYyVTVPcUhTN3RobUNwMm9UQ1VMNzhCNDdEaXpxNVdHU2w3N05NOGVJR09GOVBRPT0iLCJpYXQiOjE3MDYyODUyMzIsImV4cCI6MTcwNjI4ODgzMn0.pF00EVV7MSKL70t0q4hI6YiEZonBGSH9_6wvngQ56bj-gayz29Yq3GLvq6c6ub9TQuW5imvxYUpTonR0RNLs-A'
secretJwtKey = '27684ebcffe7f548b52bf87269d349da4f26a7eefcef2c15ded7ad3d9fc6b1ce'

app = Flask(__name__)

@app.route('/check_token')
def check_token():
    try:
        # Decode the JWT token to check its validity
        jwt.decode(jwt_token, secretJwtKey, algorithms=["HS512"])

        print("Token Verified. Please Proceed.")
        return jsonify({'message': 'Token Verified. Please Proceed.'})
    except Exception as e:
        # Handle other unexpected errors
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
