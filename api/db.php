<?php
header('Content-Type: application/json');

// Supabase credentials (server-side service_role key required for inserts)
$supabase_url = 'https://bspdslorhuuirukxrpmb.supabase.co';
$supabase_key = getenv('SUPABASE_SERVICE_ROLE_KEY') ?: 'YOUR_SUPABASE_SERVICE_ROLE_KEY';
$table_name = 'students';

// Simple Supabase REST API wrapper
class SupabaseAPI {
  private $url;
  private $key;
  
  public function __construct($url, $key) {
    $this->url = $url;
    $this->key = $key;
  }
  
  public function get($table, $filters = []) {
    $query = "?select=*";
    foreach ($filters as $col => $val) {
      $query .= "&$col=eq." . urlencode($val);
    }
    
    $ch = curl_init($this->url . "/rest/v1/$table" . $query);
    curl_setopt_array($ch, [
      CURLOPT_HTTPHEADER => [
        "apikey: {$this->key}",
        "Authorization: Bearer {$this->key}",
        "Content-Type: application/json"
      ],
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
  }
  
  public function post($table, $data) {
    $ch = curl_init($this->url . "/rest/v1/$table");
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_HTTPHEADER => [
        "apikey: {$this->key}",
        "Authorization: Bearer {$this->key}",
        "Content-Type: application/json",
        "Prefer: return=representation"
      ],
      CURLOPT_POSTFIELDS => json_encode($data),
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code >= 400) {
      return ['error' => true, 'status' => $http_code];
    }
    return json_decode($response, true);
  }
  
  public function patch($table, $data, $filter_col, $filter_val) {
    $ch = curl_init($this->url . "/rest/v1/$table?$filter_col=eq." . urlencode($filter_val));
    curl_setopt_array($ch, [
      CURLOPT_CUSTOMREQUEST => "PATCH",
      CURLOPT_HTTPHEADER => [
        "apikey: {$this->key}",
        "Authorization: Bearer {$this->key}",
        "Content-Type: application/json",
        "Prefer: return=representation"
      ],
      CURLOPT_POSTFIELDS => json_encode($data),
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code >= 400) {
      return ['error' => true, 'status' => $http_code];
    }
    return json_decode($response, true);
  }
  
  public function delete($table, $filter_col, $filter_val) {
    $ch = curl_init($this->url . "/rest/v1/$table?$filter_col=eq." . urlencode($filter_val));
    curl_setopt_array($ch, [
      CURLOPT_CUSTOMREQUEST => "DELETE",
      CURLOPT_HTTPHEADER => [
        "apikey: {$this->key}",
        "Authorization: Bearer {$this->key}",
        "Content-Type: application/json"
      ],
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $http_code >= 200 && $http_code < 300;
  }
}

// Initialize Supabase API
$supabase = new SupabaseAPI($supabase_url, $supabase_key);

// For backward compatibility
$pdo = null;
?>
