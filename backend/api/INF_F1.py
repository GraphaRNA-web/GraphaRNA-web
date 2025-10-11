import math
from api.validation_tools import RnaValidator


def CalculateF1Inf(
    target: set[tuple[int, int]], model: set[tuple[int, int]]
) -> dict[str, float | int]:
    tp = len(target & model)
    fp = len(model - target)
    fn = len(target - model)
    inf = math.sqrt(
        (tp / (tp + fp) if (tp + fp) != 0 else 0)
        * (tp / (tp + fn) if (tp + fn) != 0 else 1)
    )
    f1 = (2 * tp) / (2 * tp + fp + fn) if (2 * tp + fp + fn) != 0 else 0
    values = {}
    values["tp"] = tp
    values["fp"] = fp
    values["fn"] = fn
    values["inf"] = inf
    values["f1"] = f1
    return values


def dotbracketToPairs(input: str) -> dict[str, float | int]:
    validator = RnaValidator(input)
    result = validator.ValidateRna()
    incorrectPairs = set(result["Incorrect Pairs"])
    allPairs = set(result["allPairs"])
    correctPairs = allPairs - incorrectPairs
    print(correctPairs, allPairs, incorrectPairs)
    Pairs = {}
    Pairs["correctPairs"] = correctPairs
    Pairs["incorrectPairs"] = incorrectPairs
    Pairs["allPairs"] = allPairs
    return Pairs
