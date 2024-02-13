from Crypto.Cipher import AES
from dotenv import load_dotenv
from io import StringIO
import os
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
import pickle
import tempfile

def decrypt(environment_name):
    infile = "C:\\Users\\Trevor Tan\\OneDrive\\Documents\\GitHub\\FYP-AAT\\Backend\\.env2"
    keyfile = "C:\\Users\\Trevor Tan\\OneDrive\\Documents\\GitHub\\FYP-AAT\\Backend\\key.txt"
    
    with open(keyfile, "rb") as key:
        keydata = key.read()
        iv = keydata[:16]        #first 16 bytes
        key = keydata[16:]       #start from the 16 byte all the way to the end of the file
    
    with open(infile, "rb") as fin:
        fin.read(16)                 #read the first 16 bytes from the file so that pickle 
        
        ciphertext = pickle.load(fin)
        
        aes = AES.new(key, AES.MODE_CBC, iv=iv)
        
        plaintext = aes.decrypt(ciphertext)
        
        unpadded = unpad(plaintext, AES.block_size)

        string = unpadded.decode('utf-8')

        with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_file:
            temp_file.write(string)
            temp_file_path = temp_file.name

        load_dotenv(temp_file_path)
        os.unlink(temp_file_path)
        
        return os.getenv(environment_name)
    
fun = decrypt('MYSQL_HOST')
print(fun)