def to_unsigned(i) -> int:
    """
    Convert to unsigned
    """
    return i + 2**21

def to_signed(i) -> int:
    """
    Convert to signed
    """
    return i - 2**21

def inverse(m) -> dict:
    """
    Inverses a map (K->V => V->K)
    """
    return {v: k for k, v in m.items()}