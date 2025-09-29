import math
from api.validation_tools import RnaValidator
from collections import deque
from typing import Any
VALID_LETTERS = "ACGUacgu"
VALID_BRACKETS = ".()[]<>{}AaBbCcDd"
VALID_CONNECTIONS = [
    ["G", "C"], ["C", "G"], ["A", "U"], ["U", "A"], ["G", "U"], ["U", "G"]
]

def parseFastaFile(filename: str) -> tuple[str, str]:
    VALID_LETTERS = set("ACGUacguTt")
    VALID_BRACKETS = set(".()[]<>{}AaBbCcDd")

    strands = []
    brackets = []

    with open(filename, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            if line.startswith(">"):
                strands.append("")
                brackets.append("")
                continue

            if all(c in VALID_LETTERS for c in line):
                strands[-1] += line
            elif all(c in VALID_BRACKETS for c in line):
                brackets[-1] += line
            else:
                print(f"Skipped line with illegal chars: {line}")

    joinedStrands = " ".join(strands)
    joinedBrackets = " ".join(brackets)
    return joinedStrands, joinedBrackets


def CalculateF1Inf(target: set[tuple[int, int]], model: set[tuple[int, int]]) -> tuple[int,int,int,float, float]:
    tp = len(target & model)
    fp = len(model - target)
    fn = len(target - model)
    inf = math.sqrt((tp/(tp+fp) if (tp+fp) != 0 else 0)*(tp/(tp+fn) if (tp+fn) != 0 else 1))
    f1 = (2*tp)/(2*tp+fp+fn) if (2*tp+fp+fn) != 0 else 0

    return tp,fp,fn,inf,f1


def dotbracketToPairs(input: str) -> tuple[str,list[Any],str,set[tuple[int,int]]]:
    validator = RnaValidator(input)
    result = validator.ValidateRna()
    incorrectPairs = set(result["Incorrect Pairs"])
    allPairs= set(result["allPairs"])
    correctPairs = allPairs - incorrectPairs
    return correctPairs, incorrectPairs,allPairs
