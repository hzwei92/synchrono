(ns synchrono.core
  (:require [aleph.http :as aleph]
            [compojure.core :as comp]
            [compojure.route :as route] 
            [ring.middleware.defaults :refer [wrap-defaults api-defaults]]
            [ring.middleware.json :refer [wrap-json-response wrap-json-body]]
            [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [environ.core :refer [env]]))

(def ds (jdbc/get-datasource (env :db-uri)))

(defn insert-cell [tx cell-data]
  (sql/insert! tx :cells cell-data))

(defn insert-note [tx note-data]
  (sql/insert! tx :notes note-data))

(defn insert-hit [tx hit-data]
  (sql/insert! tx :hits hit-data))

(defn handle-signup [req]
  (let [{:strs [expo-push-token]} (:body req)]
    (jdbc/with-transaction [tx ds]
      (let [new-cell (insert-cell tx {:expo-push-token expo-push-token})]
        {:status 200
         :body {:cells [new-cell]}
         :headers {"Content-Type" "application/json"}}))))

(defn handle-post[req]
  (let [{:strs [source-id 
                target-id 
                list-id
                token
                lat
                lng
                cell-id
                charge]} (:body req)]
    (jdbc/with-transaction [tx ds]
      (let [new-note (insert-note tx {:source-id source-id
                                      :target-id target-id
                                      :list-id list-id
                                      :token token
                                      :lat lat
                                      :lng lng})
            new-hit (insert-hit tx {:cell-id cell-id
                                    :note-id (:id new-note)
                                    :charge charge})]
        {:status 200
         :body {:notes [new-note] :hits [new-hit]}
         :headers {"Content-Type" "application/json"}}))))

(defn handle-hit [req]
  (let [{:strs [cell-id note-id charge]} (:body req)]
    (jdbc/with-transaction [tx ds]
      (let [new-hit (insert-hit tx {:cell-id cell-id
                                    :note-id note-id
                                    :charge charge})]
        {:status 200
         :body {:hits [new-hit]}
         :headers {"Content-Type" "application/json"}}))))

(comp/defroutes routes
  (comp/POST "/signup" req (handle-signup req))
  (comp/POST "/post" req (handle-post req))
  (comp/POST "/hit" req (handle-hit req))
  (route/not-found {:status 404
                    :body "Not found"
                    :headers {"Content-Type" "text/plain"}}))


(defn wrap-exception-handler [handler]
  (fn [req]
    (try
      (handler req)
      (catch Exception e
        (println "Error processing request: " (.getMessage e))
        {:status 500
         :headers {"Content-Type" "text/plain"}
         :body "Internal server error"}))))

(def app
  (-> (fn [req] (routes req))
      (wrap-defaults api-defaults)
      (wrap-json-body)
      (wrap-json-response)
      (wrap-exception-handler)))

(defonce server (atom nil))

(defn start-server []
  (reset! server
          (aleph/start-server (fn [req] (app req)) {:port 3001})))

(defn stop-server []
  (when-some [s @server]
    (.close s)
    (reset! server nil)))