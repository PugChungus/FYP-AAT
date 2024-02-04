from Crypto.Random import get_random_bytes
import hashlib

a = get_random_bytes(100)

a_sha256 = hashlib.sha256(a) 

a_hexed = a.hex()

print(a_hexed)