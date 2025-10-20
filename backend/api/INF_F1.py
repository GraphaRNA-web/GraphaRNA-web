import math
from api.validation_tools import RnaValidator
from typing import Mapping, Union


def CalculateF1Inf(
    target: set[tuple[int, int]], model: set[tuple[int, int]]
) -> Mapping[str, Union[int, float]]:
    tp = len(target & model)
    fp = len(model - target)
    fn = len(target - model)
    inf = math.sqrt(
        (tp / (tp + fp) if (tp + fp) != 0 else 0)
        * (tp / (tp + fn) if (tp + fn) != 0 else 1)
    )
    f1 = (2 * tp) / (2 * tp + fp + fn) if (2 * tp + fp + fn) != 0 else 0
    values: dict[str, Union[int, float]] = {
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "inf": inf,
        "f1": f1,
    }
    return values


def dotbracketToPairs(input: str) -> dict[str, set[tuple[int, int]]]:
    validator = RnaValidator(input)
    result = validator.ValidateRna()
    incorrectPairs = set(result["Incorrect Pairs"])
    allPairs = set(result["allPairs"])
    correctPairs = allPairs - incorrectPairs

    Pairs: dict[str, set[tuple[int, int]]] = {
        "correctPairs": correctPairs,
        "incorrectPairs": incorrectPairs,
        "allPairs": allPairs,
    }
    return Pairs
