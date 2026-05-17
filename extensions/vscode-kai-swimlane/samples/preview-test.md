# Kai Swimlane preview test

## Full diagram (`kai-swimlane`)

```kai-swimlane
@kai-swimlane
/title/
Preview Test
/role/
<a>
label: Lane A;
/line/
[a: First step]
@end
```

## Minimal fence (no `@kai-swimlane` / `@end`)

```kai-swimlane
/title/
Minimal fence
/role/
<b>
label: Lane B;
/line/
[b: Second step]
```

## Parts (`kai-swimlane-parts`)

```kai-swimlane-parts
/block/
<warn>
background-color: #fee2e2;
text-color: #7f1d1d;
border-color: #b91c1c;
shape: cloud;
icon: #alert-triangle;
```
