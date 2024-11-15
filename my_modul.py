def my_func(num):
    if num[-1].lower() == 'k':
        return int(float(num[:-1])* 1000)
    elif num[-1].lower() == 'm':
        return int(float(num[:-1])* 100000)
    elif num[-1].lower() == 'b':
        return int(float(num[:-1])* 10000000)
    else:
         return int(num)

# print(my_func('10b'))