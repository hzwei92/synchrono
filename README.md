# synchrono

https://github.com/hzwei92/synchrono.git

A Clojure library
                
Spend time together, even when apart.

A cell represents a person's mobile device.
A note represents a public message.
A hit repesents an interaction between a cell and a note.

Notes organize into lists that intersect one another:,
(1) A note is an arrow
(2) A node is a note that starts and ends at itself
(3) A link is a note that starts and ends at different notes
(4) A list is a sequence of nodes and links
      (n0)-l1->(n1)...-lk->(nk)
      such that for all i, li.list-id = n0.id

## Usage

A react-native expo client for synchrono is currently in development.

## License

GPL-3.0
