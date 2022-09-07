// 
// reti mode for CodeMirror 2 by Alexander Thiemann <mail@agrafix.net>
// Edited by Michel Giehl to support the advanced ReTi's instruction set
// Derrived from CodeMirror2-LUA Mode
//
 
CodeMirror.defineMode("reti-simple", function(config, parserConfig) {


    function wordRE(words) {
      return new RegExp("^(?:" + words.join("|") + ")$", "i");
    }
    var specials = wordRE(parserConfig.specials || []);
   
    // long list of standard functions from reti manual
    var builtins = wordRE([
      'LOAD', 'LOADI', 'LOADIN1', 'LOADIN2', 
      'STORE', 'STOREIN1', 'STOREIN2', 'MOVE',
      'SUBI', 'ADDI', 'OPLUSI', 'ORI', 'ANDI', 'SUB', 'ADD', 'OPLUS', 'OR', 'AND',
      'NOP', 'JUMP', 'JUMP<', 'JUMP<=', 'JUMP>', 'JUMP>=', 'JUMP==', 'JUMP!='
    ]);
    var keywords = wordRE(['PC', 'IN1', 'IN2', 'ACC']);
  
    function normal(stream, state) {
      var ch = stream.next();
      if (ch == ";" || ch == "#") {
        stream.skipToEnd();
        return "comment";
      } 
      
      // negativ numbers
      if (ch == "-" && /\d/.test(stream.peek())) {
          stream.eatWhile(/[\w.%]/);
          return "number";
      }
  
      // other numbers
      if (/\d/.test(ch)) {
        stream.eatWhile(/[\w.%]/);
        return "number";
      }
      if (/[\w_]/.test(ch)) {
        stream.eatWhile(/[\w\\\-_.]/);
        return "variable";
      }
      return null;
    }
      
    return {
      startState: function(basecol) {
        return {basecol: basecol || 0, indentDepth: 0, cur: normal};
      },
  
      token: function(stream, state) {
        if (stream.eatSpace()) return null;
        var style = state.cur(stream, state);
        var word = stream.current();
        if (style == "variable") {
          if (keywords.test(word)) style = "keyword";
          else if (builtins.test(word)) style = "builtin";
      else if (specials.test(word)) style = "variable-2";
        }
        return style;
      }
    };
  });
  
  CodeMirror.defineMIME("text/x-reti-simple", "reti-simple");
  