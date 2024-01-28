from __future__ import print_function
from flask import Flask, render_template, request, jsonify, Response
from werkzeug.utils import secure_filename
from flask_cors import cross_origin
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
from base64 import b64encode, b64decode
from datetime import datetime, timezone
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
from pymysql.cursors import DictCursor
from dbutils.pooled_db import PooledDB
import requests
from datetime import datetime, timedelta

jwt_token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJlbmNyeXB0ZWRVc2VyRGF0YSI6IkFrcTNGU3dqblZFUWFSdTBvckFQLzFNSkFOKzh3KzZCTUFNRldEQkJyZk5kZFhyZlh3dEY5S1pRditDNFBrcWQ1elhoTUUzYjNVWVE3UjFGNXhJeGxRPT0iLCJpYXQiOjE3MDY0NTEzMDcsImV4cCI6MTcwNjQ1NDkwN30.0BUAYSMxbjVtAjm17wr31kEVdZ3xGR_N0IzbAW4v9Zwg5LAav5XE9tWAX5PFdtoPf-graNHwcXzZ5-Sn0NPLzw'
secretJwtKey = '8ade283f64c46a4d7e24ee8f2271c34b6d25dc8347fff3fa300172a3d7801490'

# db = pymysql.connect(host = 'localhost', port = 3306, user = 'root', password = 'password', database = 'major_project_db')
pool = PooledDB(
    creator=pymysql,  # Database library/module
    maxconnections=5,  # Maximum number of connections in the pool
    host='localhost',
    port=3306,
    user='root',
    password='password',
    database='major_project_db'
)


app = Flask(__name__)

@app.route('/check_token')
def check_token():
    try:
        # Check if the header starts with 'Bearer'
        blacklist_query = "SELECT * FROM token_blacklist WHERE token = %s"

        whitelist_query = "SELECT * FROM token_whitelist WHERE token = %s"

        connection = pool.connection()

        with connection.cursor() as cursor:
            cursor.execute(blacklist_query, (jwt_token))
            blacklisted_rows = cursor.fetchall()
            cursor.execute(whitelist_query, (jwt_token))
            whitelisted_rows = cursor.fetchall()

        print(whitelisted_rows)
        print(blacklisted_rows)
        decoded_token = jwt.decode(jwt_token, secretJwtKey, algorithms=["HS512"])
        print(decoded_token['exp'])

        # Check if the token is expired
        current_timestamp = int(datetime.utcnow().replace(tzinfo=timezone.utc).timestamp())
        print(current_timestamp)
        if decoded_token['exp'] < current_timestamp:
            print("Token has expired.")
            return False
        
        if not blacklisted_rows and whitelisted_rows:
            print("Token is valid and not blacklisted.")
            return True
        else:
            print("Token is invalid and blacklisted.")
            return False
    except Exception as e:
        # Handle other unexpected errors
        print({'error': str(e)})
        return False

if __name__ == '__main__':
    app.run(debug=True)
