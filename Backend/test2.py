import requests

def getAccountIdFromCookie(authorization_header):
    response = requests.get('http://localhost:3000/get-account-id', headers={'Authorization': authorization_header})
    if response.status_code == 200:
        account_id = response.json()['accountId']
        print(account_id)
        return account_id
    else:
        print('Error:', response.json()['error'])

def getEmailAddressById(id, authorization_header):
    # Make a POST request to the endpoint
    response = requests.post(
        'http://localhost:3000/get-email-by-id',
        json={'id': id},
        headers={'Authorization': authorization_header}
    )

    # Check the response status code and handle accordingly
    if response.status_code == 200:
        email = response.json()['email']
        print(email)
        return email
    elif response.status_code == 401:
        print('Unauthorized')
    else:
        print('Error:', response.json()['error'])

header = 'Bearer: eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJlbmNyeXB0ZWRVc2VyRGF0YSI6IlVQU1JEa3JYOHRtbTNvVG1QNk1tOTR4UHVZWkZSTmxtRG0xanRhRFl1UTM0VHNmcnFDbzZlYjBBQVBMeWpoWHFES2ZxWXlPRnJQbkxzbENzN0ovWjJ3PT0iLCJpYXQiOjE3MDczNzQ0ODYsImV4cCI6MTcwNzM3ODA4Nn0._wWbFramYA_KZbh4GU1DvpA01lGQIj2fZomxCLreZ1BGWptFH8TCCJr1xCc4_fXKI1QQX75tXAkpF0qq2hPvnw'

getAccountIdFromCookie(header)
getEmailAddressById(150, header)