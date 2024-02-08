id_from_cookie = getAccountIdFromCookie(authorization_header)

if account_id == id_from_cookie:
    print('Match')
else:
    return jsonify({'error': 'Access forbidden'}), 401


email = request.form['email']
id = getAccountIdFromCookie(authorization_header)
email_from_cookie = getEmailAddressById(id, authorization_header)


if email != email_from_cookie:
    return jsonify({'error': 'Access forbidden'}), 401