import math
from api.validation_tools import RnaValidator
from typing import Any


def CalculateF1Inf(target: set[tuple[int, int]], model: set[tuple[int, int]]) -> tuple[int,int,int,float, float]:
    tp = len(target & model)
    fp = len(model - target)
    fn = len(target - model)
    inf = math.sqrt((tp/(tp+fp) if (tp+fp) != 0 else 0)*(tp/(tp+fn) if (tp+fn) != 0 else 1))
    f1 = (2*tp)/(2*tp+fp+fn) if (2*tp+fp+fn) != 0 else 0

    return tp,fp,fn,inf,f1


def dotbracketToPairs(input: str) -> tuple[set[Any],set[Any],set[Any]]:
    validator = RnaValidator(input)
    result = validator.ValidateRna()
    incorrectPairs = set(result["Incorrect Pairs"])
    allPairs= set(result["allPairs"])
    correctPairs = allPairs - incorrectPairs
    print(correctPairs,allPairs,incorrectPairs)
    return correctPairs, incorrectPairs, allPairs
