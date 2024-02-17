(defproject synchrono "0.1.0-SNAPSHOT"
  :description "SYNCHRONO
                
                Spend time together, even when apart.

                A cell represents a person's mobile device.
                A note represents a public message.
                A hit repesents an interaction between a cell and a note.
                
                Notes organize into lists that intersect one another:
                (1) A note is an arrow
                (2) A node is a note that starts and ends at itself
                (3) A link is a note that starts and ends at different notes
                (4) A list is a sequence of nodes and links
                    (n0)-l1->(n1)...-lk->(nk)
                    such that for all i, li.list-id = n0.id"
  :url "https://synchrono.city"
  :license {:name "GPL-3.0"
            :url "https://www.gnu.org/licenses/gpl-3.0.en.html"}
  :dependencies [[org.clojure/clojure "1.11.1"]
                 [com.github.seancorfield/next.jdbc "1.3.909"]
                 [org.postgresql/postgresql "42.7.1"]
                 [ring/ring-core "1.11.0"]
                 [ring/ring-defaults "0.4.0"]
                 [ring/ring-json "0.5.1"]
                 [aleph "0.7.1"]
                 [compojure "1.7.1"]
                 [migratus "1.5.4"]
                 [environ "1.2.0"]]
  :plugins [[migratus-lein "0.7.3"]
            [lein-environ "1.2.0"]]
  :env {"DB_URI" "jdbc:postgresql://postgres:postgres@localhost:5432/synchrono"}
  :migratus {:store :database
             :migration-dir "resources/migrations"
             :db ~(get (System/getenv) "DB_URI")}
  :repl-options {:init-ns synchrono.core})
