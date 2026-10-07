package com.quanliphongtro.service;

import com.quanliphongtro.entity.CauHinh;
import com.quanliphongtro.repository.CauHinhRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CauHinhService {

    @Autowired
    private CauHinhRepository cauHinhRepository;

    public Map<String, String> getAllConfigs() {
        List<CauHinh> list = cauHinhRepository.findAll();
        Map<String, String> configs = new HashMap<>();
        for (CauHinh c : list) {
            configs.put(c.getKeyName(), c.getKeyValue());
        }
        return configs;
    }

    public void saveConfigs(Map<String, String> configs) {
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            CauHinh c = new CauHinh(entry.getKey(), entry.getValue());
            cauHinhRepository.save(c);
        }
    }
}
