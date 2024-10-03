<?php

header('Content-Type: application/json; charset=utf-8');
echo discoverPrinters();

function savePrinterInfo($response) {
    $json = 'printers.json';
    $printers = new stdClass();
    if (file_exists($json)) {
      $printers = json_decode(file_get_contents($json));
    }
    $info = json_decode($response);
    $data = $info->Data;
    $id = $info->Id;
    $printer = array(
      'name' => $data->Name,
      'model' => $data->MachineName,
      'brand' => $data->BrandName,
      'ip'  => $data->MainboardIP,
      'mainboard'  => $data->MainboardID,
      'protocol' => $data->ProtocolVersion,
      'firmware' => $data->FirmwareVersion,
    );
    $printers->$id = $printer;
    if (file_put_contents($json, json_encode($printers, JSON_PRETTY_PRINT))) {
      return true;
    }
    return false;
}

function discoverPrinters() {
  $socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
  $sockets = array($socket);
  $null = NULL;
  $socketTimeout = 3;
  $socketOpen = true;
  $msg = "M99999";
  $json = 'printers.json';

  socket_set_option($socket, SOL_SOCKET, SO_BROADCAST, 1);
  socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, 1);
  socket_set_option($socket, SOL_SOCKET, SO_REUSEPORT, 1);
  socket_set_option($socket, SOL_SOCKET, SO_RCVTIMEO, array("sec"=>$socketTimeout, "usec"=>0));
  socket_bind($socket, '0.0.0.0');
  socket_sendto($socket, $msg, strlen($msg), 0, '255.255.255.255', 3000);
  
  while($socketOpen) {
    if (socket_recv($socket, $data, 9999, 0)) {
      //echo "Response received: ".$data.PHP_EOL;
      savePrinterInfo($data);
    }
    $socketOpen = socket_select($sockets, $null, $null, $socketTimeout);
  }
  if (file_exists($json)) {
    return file_get_contents($json);
  } else {
    return "{}";
  }
}
