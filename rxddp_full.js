/* Package-scope variables */
var Random;
var Alea = function Alea() {                                                                                           
  function Mash() {                                                                                                    
    var n = 0xefc8249d;                                                                                                

    var mash = function mash(data) {                                                                                   
      data = data.toString();                                                                                          
      for (var i = 0; i < data.length; i++) {                                                                          
        n += data.charCodeAt(i);                                                                                       
        var h = 0.02519603282416938 * n;                                                                               
        n = h >>> 0;                                                                                                   
        h -= n;                                                                                                        
        h *= n;                                                                                                        
        n = h >>> 0;                                                                                                   
        h -= n;                                                                                                        
        n += h * 0x100000000;
      }                                                                                                                
      return (n >>> 0) * 2.3283064365386963e-10;
    };                                                                                                                 

    mash.version = 'Mash 0.9';                                                                                         
    return mash;                                                                                                       
  }                                                                                                                    

  return function (args) {                                                                                             
    var s0 = 0;                                                                                                        
    var s1 = 0;                                                                                                        
    var s2 = 0;                                                                                                        
    var c = 1;                                                                                                         

    if (args.length == 0) {                                                                                            
      args = [+new Date()];                                                                                            
    }                                                                                                                  
    var mash = Mash();                                                                                                 
    s0 = mash(' ');                                                                                                    
    s1 = mash(' ');                                                                                                    
    s2 = mash(' ');                                                                                                    

    for (var i = 0; i < args.length; i++) {                                                                            
      s0 -= mash(args[i]);                                                                                             
      if (s0 < 0) {                                                                                                    
        s0 += 1;                                                                                                       
      }                                                                                                                
      s1 -= mash(args[i]);                                                                                             
      if (s1 < 0) {                                                                                                    
        s1 += 1;                                                                                                       
      }                                                                                                                
      s2 -= mash(args[i]);                                                                                             
      if (s2 < 0) {                                                                                                    
        s2 += 1;                                                                                                       
      }                                                                                                                
    }                                                                                                                  
    mash = null;                                                                                                       

    var random = function random() {                                                                                   
      var t = 2091639 * s0 + c * 2.3283064365386963e-10;
      s0 = s1;                                                                                                         
      s1 = s2;                                                                                                         
      return s2 = t - (c = t | 0);                                                                                     
    };                                                                                                                 
    random.uint32 = function () {                                                                                      
      return random() * 0x100000000;
    };                                                                                                                 
    random.fract53 = function () {                                                                                     
      return random() + (random() * 0x200000 | 0) * 1.1102230246251565e-16;
    };                                                                                                                 
    random.version = 'Alea 0.9';                                                                                       
    random.args = args;                                                                                                
    return random;                                                                                                     
  }(Array.prototype.slice.call(arguments));                                                                            
};                                                                                                                     

var UNMISTAKABLE_CHARS = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";                                    
var BASE64_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" + "0123456789-_";                            

// `type` is one of `RandomGenerator.Type` as defined below.                                                           
//                                                                                                                     
// options:                                                                                                            
// - seeds: (required, only for RandomGenerator.Type.ALEA) an array                                                    
//   whose items will be `toString`ed and used as the seed to the Alea                                                 
//   algorithm                                                                                                         
var RandomGenerator = function RandomGenerator(type, options) {                                                        
  var self = this;                                                                                                     
  self.type = type;                                                                                                    

  if (!RandomGenerator.Type[type]) {
    throw new Error("Unknown random generator type: " + type);
  }

  if (type === RandomGenerator.Type.ALEA) {
    if (!options.seeds) {
      throw new Error("No seeds were provided for Alea PRNG");
    }
    self.alea = Alea.apply(null, options.seeds);
  }
};

// Types of PRNGs supported by the `RandomGenerator` class
RandomGenerator.Type = {
  // Use Node's built-in `crypto.getRandomBytes` (cryptographically
  // secure but not seedable, runs only on the server). Reverts to
  // `crypto.getPseudoRandomBytes` in the extremely uncommon case that
  // there isn't enough entropy yet
  NODE_CRYPTO: "NODE_CRYPTO",

  // Use non-IE browser's built-in `window.crypto.getRandomValues`                                                     
  // (cryptographically secure but not seedable, runs only in the                                                      
  // browser).                                                                                                         
  BROWSER_CRYPTO: "BROWSER_CRYPTO",                                                                                    

  // Use the *fast*, seedaable and not cryptographically secure                                                        
  // Alea algorithm                                                                                                    
  ALEA: "ALEA"                                                                                                         
};                                                                                                                     

/**
 * @name Random.fraction
 * @summary Return a number between 0 and 1, like `Math.random`.
 * @locus Anywhere
 */
RandomGenerator.prototype.fraction = function () {
  var self = this;
  if (self.type === RandomGenerator.Type.ALEA) {
    return self.alea();
  } else if (self.type === RandomGenerator.Type.NODE_CRYPTO) {
    var numerator = parseInt(self.hexString(8), 16);
    return numerator * 2.3283064365386963e-10;
  } else if (self.type === RandomGenerator.Type.BROWSER_CRYPTO) {
    var array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] * 2.3283064365386963e-10;
  } else {
    throw new Error('Unknown random generator type: ' + self.type);
  }
};

/**
 * @name Random.hexString
 * @summary Return a random string of `n` hexadecimal digits.
 * @locus Anywhere
 * @param {Number} n Length of the string
 */
RandomGenerator.prototype.hexString = function (digits) {
  var self = this;                                                                                                     
  if (self.type === RandomGenerator.Type.NODE_CRYPTO) {                                                                
    var numBytes = Math.ceil(digits / 2);                                                                              
    var bytes;                                                                                                         
    // Try to get cryptographically strong randomness. Fall back to                                                    
    // non-cryptographically strong if not available.                                                                  
    try {                                                                                                              
      bytes = nodeCrypto.randomBytes(numBytes);                                                                        
    } catch (e) {                                                                                                      
      // XXX should re-throw any error except insufficient entropy                                                     
      bytes = nodeCrypto.pseudoRandomBytes(numBytes);                                                                  
    }                                                                                                                  
    var result = bytes.toString("hex");                                                                                
    // If the number of digits is odd, we'll have generated an extra 4 bits                                            
    // of randomness, so we need to trim the last digit.                                                               
    return result.substring(0, digits);                                                                                
  } else {                                                                                                             
    return this._randomString(digits, "0123456789abcdef");                                                             
  }                                                                                                                    
};                                                                                                                     

RandomGenerator.prototype._randomString = function (charsCount, alphabet) {                                            
  var self = this;                                                                                                     
  var digits = [];                                                                                                     
  for (var i = 0; i < charsCount; i++) {                                                                               
    digits[i] = self.choice(alphabet);                                                                                 
  }                                                                                                                    
  return digits.join("");                                                                                              
};                                                                                                                     

/**                                                                                                                    
 * @name Random.id
 * @summary Return a unique identifier, such as `"Jjwjg6gouWLXhMGKW"`, that is
 * likely to be unique in the whole world.
 * @locus Anywhere
 * @param {Number} [n] Optional length of the identifier in characters
 *   (defaults to 17)
 */
RandomGenerator.prototype.id = function (charsCount) {                                                                 
  var self = this;                                                                                                     
  // characters is around 96 bits of entropy, which is the amount of
  // state in the Alea PRNG.                                                                                           
  if (charsCount === undefined) charsCount = 17;                                                                       

  return self._randomString(charsCount, UNMISTAKABLE_CHARS);                                                           
};                                                                                                                     

/**                                                                                                                    
 * @name Random.secret
 * @summary Return a random string of printable characters with 6 bits of
 * entropy per character. Use `Random.secret` for security-critical secrets
 * that are intended for machine, rather than human, consumption.
 * @locus Anywhere
 * @param {Number} [n] Optional length of the secret string (defaults to 43
 *   characters, or 256 bits of entropy)
 */
RandomGenerator.prototype.secret = function (charsCount) {                                                             
  var self = this;                                                                                                     
  // Default to 256 bits of entropy, or 43 characters at 6 bits per                                                    
  // character.                                                                                                        
  if (charsCount === undefined) charsCount = 43;                                                                       
  return self._randomString(charsCount, BASE64_CHARS);                                                                 
};                                                                                                                     

/**                                                                                                                    
 * @name Random.choice
 * @summary Return a random element of the given array or string.
 * @locus Anywhere
 * @param {Array|String} arrayOrString Array or string to choose from
 */
RandomGenerator.prototype.choice = function (arrayOrString) {                                                          
  var index = Math.floor(this.fraction() * arrayOrString.length);                                                      
  if (typeof arrayOrString === "string") return arrayOrString.substr(index, 1);else return arrayOrString[index];       
};                                                                                                                     

// instantiate RNG.  Heuristically collect entropy from various sources when a                                         
// cryptographic PRNG isn't available.                                                                                 
//
// client sources                                                                                                      
var height = typeof window !== 'undefined' && window.innerHeight || typeof document !== 'undefined' && document.documentElement && document.documentElement.clientHeight || typeof document !== 'undefined' && document.body && document.body.clientHeight || 1;
var width = typeof window !== 'undefined' && window.innerWidth || typeof document !== 'undefined' && document.documentElement && document.documentElement.clientWidth || typeof document !== 'undefined' && document.body && document.body.clientWidth || 1;
var agent = typeof navigator !== 'undefined' && navigator.userAgent || "";                                             

function createAleaGeneratorWithGeneratedSeed() {
  return new RandomGenerator(RandomGenerator.Type.ALEA, {seeds: [new Date(), height, width, agent, Math.random()]});
}

if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {                               
  Random = new RandomGenerator(RandomGenerator.Type.BROWSER_CRYPTO);                                                 
} else {                                                                                                             
  // On IE 10 and below, there's no browser crypto API                                                               
  // available. Fall back to Alea                                                                                    
  //                                                                                                                 
  // XXX looks like at the moment, we use Alea in IE 11 as well,                                                     
  // which has `window.msCrypto` instead of `window.crypto`.                                                         
  Random = createAleaGeneratorWithGeneratedSeed();                                                                   
}                                                                                                                    

// Create a non-cryptographically secure PRNG with a given seed (using                                                 
// the Alea algorithm)                                                                                                 
Random.createWithSeeds = function () {                                                                                 
  for (var _len = arguments.length, seeds = Array(_len), _key = 0; _key < _len; _key++) {                              
    seeds[_key] = arguments[_key];                                                                                     
  }                                                                                                                    

  if (seeds.length === 0) {                                                                                            
    throw new Error("No seeds were provided");                                                                         
  }
  return new RandomGenerator(RandomGenerator.Type.ALEA, { seeds: seeds });                                             
};

// Used like `Random`, but much faster and not cryptographically                                                       
// secure                                                                                                              
Random.insecure = createAleaGeneratorWithGeneratedSeed();/// METEOR WRAPPER
//
SHA256 = (function () {


/**
*
*  Secure Hash Algorithm (SHA256)
*  http://www.webtoolkit.info/javascript-sha256.html
*  http://anmar.eu.org/projects/jssha2/
*
*  Original code by Angel Marin, Paul Johnston.
*
**/

function SHA256(s){

	var chrsz   = 8;
	var hexcase = 0;

	function safe_add (x, y) {
		var lsw = (x & 0xFFFF) + (y & 0xFFFF);
		var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
	}

	function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
	function R (X, n) { return ( X >>> n ); }
	function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
	function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
	function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
	function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
	function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
	function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }

	function core_sha256 (m, l) {
		var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
		var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
		var W = new Array(64);
		var a, b, c, d, e, f, g, h, i, j;
		var T1, T2;

		m[l >> 5] |= 0x80 << (24 - l % 32);
		m[((l + 64 >> 9) << 4) + 15] = l;

		for ( var i = 0; i<m.length; i+=16 ) {
			a = HASH[0];
			b = HASH[1];
			c = HASH[2];
			d = HASH[3];
			e = HASH[4];
			f = HASH[5];
			g = HASH[6];
			h = HASH[7];

			for ( var j = 0; j<64; j++) {
				if (j < 16) W[j] = m[j + i];
				else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);

				T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
				T2 = safe_add(Sigma0256(a), Maj(a, b, c));

				h = g;
				g = f;
				f = e;
				e = safe_add(d, T1);
				d = c;
				c = b;
				b = a;
				a = safe_add(T1, T2);
			}

			HASH[0] = safe_add(a, HASH[0]);
			HASH[1] = safe_add(b, HASH[1]);
			HASH[2] = safe_add(c, HASH[2]);
			HASH[3] = safe_add(d, HASH[3]);
			HASH[4] = safe_add(e, HASH[4]);
			HASH[5] = safe_add(f, HASH[5]);
			HASH[6] = safe_add(g, HASH[6]);
			HASH[7] = safe_add(h, HASH[7]);
		}
		return HASH;
	}

	function str2binb (str) {
		var bin = Array();
		var mask = (1 << chrsz) - 1;
		for(var i = 0; i < str.length * chrsz; i += chrsz) {
			bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
		}
		return bin;
	}

	function Utf8Encode(string) {
		// METEOR change:
		// The webtoolkit.info version of this code added this
		// Utf8Encode function (which does seem necessary for dealing
		// with arbitrary Unicode), but the following line seems
		// problematic:
		//
		// string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	}

	function binb2hex (binarray) {
		var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
		var str = "";
		for(var i = 0; i < binarray.length * 4; i++) {
			str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
			hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
		}
		return str;
	}

	s = Utf8Encode(s);
	return binb2hex(core_sha256(str2binb(s), s.length * chrsz));

}

/// METEOR WRAPPER
return SHA256;
})();
// Generated by CoffeeScript 1.11.1
(function() {
  var DDP_VERSIONS,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DDP_VERSIONS = ['1', 'pre2', 'pre1'];

  this.RxDDP = (function() {
    function RxDDP(wsUri) {
      this.getCollection = bind(this.getCollection, this);
      this.setCollection = bind(this.setCollection, this);
      this.readySubscription = bind(this.readySubscription, this);
      this.subscribeStream = bind(this.subscribeStream, this);
      this.callStream = bind(this.callStream, this);
      this.methodResult = bind(this.methodResult, this);
      this.pong = bind(this.pong, this);
      this.wsUri = wsUri;
      this.subs = {};
      this.results = {};
      this.collections = {};
      this.sock;
      this.closeObservable = new Rx.Subject;
    }

    RxDDP.prototype._id = function() {
      var cnt;
      cnt = 0;
      return {
        next: function() {
          return "" + (++cnt);
        }
      };
    };

    RxDDP.prototype.connect = function() {
      return Rx.Observable.create((function(_this) {
        return function(conn) {
          _this.sock = new WebSocket(_this.wsUri);
          _this.sock.onopen = function() {
            return _this.send({
              msg: 'connect',
              version: DDP_VERSIONS[0],
              support: DDP_VERSIONS
            });
          };
          _this.sock.onerror = conn.error;
          _this.sock.onmessage = function(msg) {
            var data, eventHandler;
            data = JSON.parse(msg.data);
            eventHandler = {
              'connected': function(msg) {
                return conn.next(msg);
              },
              'ping': _this.pong,
              'added': _this.setCollection,
              'removed': _this.setCollection,
              'changed': _this.setCollection,
              'result': _this.methodResult,
              'ready': _this.readySubscription
            };
            eventHandler = eventHandler[data.msg];
            return eventHandler && eventHandler(data);
          };
          return _this.sock.onclose = function(status) {
            return _this.closeObservable.next(status);
          };
        };
      })(this));
    };

    RxDDP.prototype.send = function(msg) {
      return this.sock.send(JSON.stringify(msg));
    };

    RxDDP.prototype.pong = function() {
      return this.send({
        msg: 'pong'
      });
    };

    RxDDP.prototype.close = function() {
      return this.sock.close();
    };

    RxDDP.prototype.getStream = function(id) {
      this.results[id] = this.results[id] || new Rx.Subject();
      return this.results[id];
    };

    RxDDP.prototype.methodResult = function(msg) {
      return this.getStream(msg.id).next(msg.result);
    };

    RxDDP.prototype.callStream = function(methodName, params) {
      var id;
      if (params == null) {
        params = [];
      }
      id = this._id().next();
      this.send({
        id: id,
        msg: 'method',
        method: methodName,
        params: params
      });
      return this.getStream(this.results[id]);
    };

    RxDDP.prototype.subscribeStream = function(publicationName, params) {
      var id;
      if (params == null) {
        params = [];
      }
      id = Random.id();
      this.send({
        id: id,
        msg: 'sub',
        name: publicationName,
        params: params
      });
      return this.getStream(id);
    };

    RxDDP.prototype.readySubscription = function(msg) {
      var i, len, ref, results, sub;
      ref = msg.subs;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        sub = ref[i];
        results.push(this.getStream(this.subs[sub]).next(sub));
      }
      return results;
    };

    RxDDP.prototype.setCollection = function(msg) {
      return this.getStream(msg.collection).next(msg);
    };

    RxDDP.prototype.getCollection = function(collection) {
      return this.getStream(collection);
    };

    return RxDDP;

  })();

}).call(this);

//# sourceMappingURL=rxddp.js.map
