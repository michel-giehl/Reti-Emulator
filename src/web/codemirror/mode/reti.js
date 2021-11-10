// 
// reti mode for CodeMirror 2 by Alexander Thiemann <mail@agrafix.net>
// Edited by Michel Giehl to support the advanced ReTi's instruction set
// Derrived from CodeMirror2-LUA Mode
//
 
CodeMirror.defineMode("reti", function(config, parserConfig) {


    function wordRE(words) {
      return new RegExp("^(?:" + words.join("|") + ")$", "i");
    }
    var specials = wordRE(parserConfig.specials || []);
   
    // long list of standard functions from reti manual
    var builtins = wordRE([
      'LOAD', 'LOADI', 'LOADIN', 
      'STORE', 'STOREIN', 'MOVE',
      'SUBI', 'ADDI', 'OPLUSI', 'ORI', 'ANDI', 'SUB', 'ADD', 'OPLUS', 'OR', 'AND', 'MUL', 'MULI', 'DIV', 'DIVI',
      'NOP', 'JMP', 'JL', 'JLE', 'JG', 'JGE', 'JE', 'JNE'
    ]);
    var keywords = wordRE(['PC', 'IN1', 'IN2', 'ACC', 'SP', 'BAF', 'CS', 'DS']);
  
    function normal(stream, state) {
      var ch = stream.next();
      if (ch == ";") {
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
  
  CodeMirror.defineMIME("text/x-reti", "reti");
  