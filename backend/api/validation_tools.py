from typing import Dict, List, Tuple
from collections import deque


def FastaFileParse(inputStructure: str) -> str:
    """
    Converts strands to uppercase, replaces T with U, and joins them with spaces
    """
    inputStructureSplit: List[str] = inputStructure.split("\n")
    nucleotides: str = ""
    dotBracket: str = ""
    for i in range(len(inputStructureSplit)):
        if inputStructureSplit[i][0] == ">":
            nucleotides += inputStructureSplit[i + 1]
            nucleotides += " "
            
            dotBracket += inputStructureSplit[i + 2]
            dotBracket += " " 
    parsedStructure: str = nucleotides.strip().replace("T", "U").upper() + "\n" + dotBracket.strip()
    return parsedStructure


def RnaValidation(inputStr: str) -> Tuple[bool, str, str, str, List[Tuple[int, int]]]:
    """
    Resturns a tuple in this format:
    - First value: validation passed: bool,
    - Second value: type of error if validation not passed: str
    - Third value: validated str if validation passed or suggested fix if validation not passed: str
    - Fourth value: str containing invalid characters, if validation not passed: str
    - Fifth value: str containing invalid bracket characters, if validation not passed: str
    - Sixth value: list of indices of mismatching brackets (in that case third value contains suggested fix): List[int]
    - Seventh value: list of paris of indices of mismatching rna pairs (in that case third value contains suggested fix): List[Tuple[int, int]] 
    """ 
    rnaSplit: List[str] = inputStr.split("\n")
    rna: str = rnaSplit[0] 
    dotBracket: str = rnaSplit[1]

    # length check
    if len(rna) != len(dotBracket): 
        return (False, "RNA and DotBracket not of equal lengths", "", "", "",  [], [])
    
    # character check
    validNucleotides: set = set("AUGC ")
    invalidCharacters: set = set(char for char in rna.upper() if char not in validNucleotides)
    if len(invalidCharacters) > 0:
        return (False, "RNA contains invalid characters", "", "".join(invalidCharacters), "", [], [])
    
    # bracket check
    validBrackets: set = set("()<>[]{}AaBbCcDd. ")
    invalidBrackets: set = set(char for char in dotBracket if char not in validBrackets)
    if len(invalidBrackets) > 0:
        return (False, "DotBracket contains invalid brackets", "", "",  "".join(invalidBrackets), [], [])

    # stack check
    bracketStacks: Dict[str, deque[int]] = {
        "()": deque(),
        "<>": deque(),
        "[]": deque(),
        "{}": deque(),
        "Aa": deque(),
        "Bb": deque(),
        "Cc": deque(),
        "Dd": deque(),
    }
    openingLookup: dict[str, str] = {pair[0]: pair for pair in bracketStacks.keys()}
    closingLookup: dict[str, str] = {pair[1]: pair for pair in bracketStacks.keys()}
    mismatchingBrackets: List[int] = []
    incorrectPairs: List[Tuple[int, int]] = []
    suggestedDotBracketFix: List[str] = list(dotBracket)
    validPairs: List[str] = ["GC", "CG", "AU", "UA", "GU", "UG"]
    for i in range(len(dotBracket)):
        if dotBracket[i] in openingLookup: # opening brackets
            bracketStacks[openingLookup[dotBracket[i]]].append(i)
        elif dotBracket[i] in closingLookup: # closing brackets
            if len(bracketStacks[closingLookup[dotBracket[i]]]) > 0: # check if a matching bracket exists 
                if rna[bracketStacks[closingLookup[dotBracket[i]]][-1]] + rna[i] in validPairs: # check if the nucleotide pair is correct
                    bracketStacks[closingLookup[dotBracket[i]]].pop()
                else: # incorrect nucleotide pair, suggest replacement to .
                    incorrectPairs.append((bracketStacks[closingLookup[dotBracket[i]]][-1], i))
                    suggestedDotBracketFix[i] = "."
                    suggestedDotBracketFix[bracketStacks[closingLookup[dotBracket[i]]][-1]] = "."
                    bracketStacks[closingLookup[dotBracket[i]]].pop()
            else: # mismatched closing bracket, suggest replacement to .
                mismatchingBrackets.append(i) 
                suggestedDotBracketFix[i] = "."

    for stack in bracketStacks.values(): # check stacks for unclosed opening bracket
        for bracket in stack: #mismatched opening bracket, suggest replacement to .
            mismatchingBrackets.append(bracket) 
            suggestedDotBracketFix[bracket] = "."
    if "".join(suggestedDotBracketFix) != dotBracket:
        return (True, "Fix suggested", rna + "\n" + "".join(suggestedDotBracketFix),"".join(invalidCharacters), "".join(invalidBrackets), mismatchingBrackets, incorrectPairs)
    else:
        return (True, "Correct validation", rna + "\n" + "".join(suggestedDotBracketFix),"".join(invalidCharacters), "".join(invalidBrackets), mismatchingBrackets, incorrectPairs)






#print(FastaFileParse(">example1\ndsfs\n((."))

#print(FastaFileParse(">example1\nAGC\n((.\n>example2\nUUG\n.))"))
#print(RnaValidation(FastaFileParse(">example1\ngCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA\n(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))....")))
#print(RnaValidation(FastaFileParse(">example1\nAGC UUG\n(.. .))")))
#print(RnaValidation(FastaFileParse(">example1\ngggggCGGAUUUAgCUCAGuuGGGAGAGCgCCAGAcUgAAgAucUGGAGgUCcUGUGuuCGaUCCACAGAAUUCGCACCA\n()Aa(((((((..((((.....[..)))).((((.........)))).....(((((..]....))))))))))))....")))