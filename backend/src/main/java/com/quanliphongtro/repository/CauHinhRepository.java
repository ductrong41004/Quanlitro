package com.quanliphongtro.repository;

import com.quanliphongtro.entity.CauHinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CauHinhRepository extends JpaRepository<CauHinh, String> {
}
