document.getElementById('tfa').addEventListener('click', disableTFA)


export async function disableTFA(event) {
    event.preventDefault()
    alert("Triggerd")
    const encryptedEmail = sessionStorage.getItem('encrypted_email');
    let emailData;
  
    if (!encryptedEmail) {
      console.error('Encrypted email not found in sessionStorage');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/decrypt_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedEmail: encryptedEmail,
        }),
      });
  
      emailData = await response.json();
  
      console.log('Decrypted Email Data:', emailData);
      console.log("MORE SPECIFIC:",emailData.decryptedEmail )
      if (emailData.decryptedEmail) {
        const emailValue = emailData.decryptedEmail;
        console.log("email check:", emailValue)
  
        if (!emailValue) {
          // Handle the case where the email is not found in sessionStorage
          console.error('Email not found in sessionStorage');
          return;
        } else {
          try {
              const response = await fetch(`http://localhost:5000/email_disabletfa`, {
                method : 'POST',
                headers : {
                  'Content-Type' : 'application/json',
                },
                body: JSON.stringify({ email: emailValue})
              })
  
              const isEmailSent = await response.json()
  
              if (isEmailSent.message === 'Email sent successfully') {
                alert('An Email has been sent to disable your 2 factor Authentication. ')
              }
  
          } catch (err) {
              console.error("Errorrrr:", err)
          }
        }
      }
    } catch (err) {
      console.error("Error:", err)
    }
  
  }