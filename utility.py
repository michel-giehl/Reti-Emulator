from constants import I
from sys import getsizeof

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

def get_size(obj, seen=None):
    """
    Recursively finds size of objects
    Source: https://goshippo.com/blog/measure-real-size-any-python-object/
    """
    size = getsizeof(obj)
    if seen is None:
        seen = set()
    obj_id = id(obj)
    if obj_id in seen:
        return 0
    # Important mark as seen *before* entering recursion to gracefully handle
    # self-referential objects
    seen.add(obj_id)
    if isinstance(obj, dict):
        size += sum([get_size(v, seen) for v in obj.values()])
        size += sum([get_size(k, seen) for k in obj.keys()])
    elif hasattr(obj, '__dict__'):
        size += get_size(obj.__dict__, seen)
    elif hasattr(obj, '__iter__') and not isinstance(obj, (str, bytes, bytearray)):
        size += sum([get_size(i, seen) for i in obj])
    return size

def encode_mem_sections(memory):
    """
    puts non 0 memory sections in a map.
    """
    result = dict()
    for i in range(len(memory)):
        if memory[i] != 0:
            result[i] = memory[i]
    return result

def read_pattern(pattern, instruction):
    curr = None
    response = dict()
    for i, chr in enumerate(pattern):
        if curr is None or curr != chr:
            curr = chr
            response[curr] = 0
        mask_raw = 1 << (len(pattern) - 1 - i)
        response[curr] |= mask_raw & instruction
        # response[curr]["raw"] |= mask_raw & instruction
    return response

if __name__ == "__main__":
    print(read_pattern("TT" + "D" * 30, 1887436804))