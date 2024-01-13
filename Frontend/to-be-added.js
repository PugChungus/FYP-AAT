
function authorizeRoles() { //check for user otherwise redirect back to login page
    return (req, res, next) => {
      const userRoles = req.user.roles || [];
      const allowedRoles = 'user';
  
      if (allowedRoles.some(role => userRoles.includes(role))) {
        next();
      } else {
        res.status(403).json({ message: 'Insufficient permissions' });
        return res.redirect('/');
        // Alternatively, you can redirect to a different page or send a custom error response
        // res.redirect('/no-permission-page');
        // res.render('no-permission', { user: req.user });
      }
    };
  }

  //redirect to start page if token is invalid or does not exist

app.get('/verify', (req, res) => {
    // Verify the JWT token
    const jwtToken = req.cookies.jwtToken;

    if (!jwtToken) {
        // If there's no token, redirect to the starting page
        return res.redirect('/');
    }

    jwt.verify(jwtToken, secretJwtKey, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                // Token has expired
                res.status(401).send('Token has expired');
            } else {
                // Other verification errors
                res.status(401).send('Invalid token');
            }
        } else {
            // Token is valid, proceed with displaying the dashboard
            res.redirect('/');
        }
    });
});

  